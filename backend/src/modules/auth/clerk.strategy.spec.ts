import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ClerkStrategy } from './clerk.strategy';
import { RolesGuard } from '../../common/guards/roles.guard';

// Mock the external Clerk backend SDK
jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

import { verifyToken } from '@clerk/backend';

describe('Auth & Sync Testing', () => {
  describe('ClerkStrategy & RolesGuard', () => {
    let strategy: ClerkStrategy;
    const mockClerkClient = {
      users: { getUser: jest.fn() },
    };
    const mockConfigService = {
      get: jest.fn().mockReturnValue('fake_secret_key'),
    };
    const mockAuthService = {
      findOrCreateUser: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'error').mockImplementation(() => {});
      strategy = new ClerkStrategy(
        mockClerkClient as any,
        mockConfigService as any,
        mockAuthService as any,
      );
    });

    it('TC06: throws UnauthorizedException when no Bearer Token in HTTP Header', async () => {
      const req = { headers: {} } as any;
      await expect(strategy.validate(req)).rejects.toThrow(
        new UnauthorizedException('No authentication token provided'),
      );
    });

    it('TC07: throws UnauthorizedException for invalid, expired, or fake token', async () => {
      const req = { headers: { authorization: 'Bearer FAKE_TOKEN' } } as any;
      (verifyToken as jest.Mock).mockResolvedValue({ sub: null });

      await expect(strategy.validate(req)).rejects.toThrow(
        new UnauthorizedException('Invalid token: no user ID'),
      );
    });

    it('TC08: RolesGuard blocks access if user is banned', () => {
      const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['USER']) };
      const guard = new RolesGuard(reflector as any);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'USER', isBanned: true } }),
        }),
      };

      expect(() => guard.canActivate(context as any)).toThrow(
        new ForbiddenException('Your account has been suspended'),
      );
    });

    it('TC09: fails with Timeout when syncing new user avatar from Clerk', async () => {
      const req = { headers: { authorization: 'Bearer VALID_NEW_TOKEN' } } as any;
      (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_new' });
      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'user_new',
        emailAddresses: [],
        imageUrl: 'http://very-slow-image-server.com/avatar.jpg',
      });

      // Simulate the timeout failure during DB creation/sync
      mockAuthService.findOrCreateUser.mockRejectedValue(
        new Error('Timeout 5000ms exceeded while downloading avatar'),
      );

      await expect(strategy.validate(req)).rejects.toThrow(
        'Authentication failed: Timeout 5000ms exceeded while downloading avatar',
      );
    });

    it('TC10: skips creation and attaches internal DB user successfully', async () => {
      const req = { headers: { authorization: 'Bearer VALID_OLD_TOKEN' } } as any;
      (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_old' });
      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'user_old',
        emailAddresses: [],
      });
      mockAuthService.findOrCreateUser.mockResolvedValue({
        id: 'db-uuid-1234',
        clerkId: 'user_old',
      });

      const result = await strategy.validate(req);
      expect(result.id).toBe('db-uuid-1234');
      expect(mockAuthService.findOrCreateUser).toHaveBeenCalled();
    });
  });
});
