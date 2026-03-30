/**
 * Clerk Passport Strategy
 * Verify JWT token từ Clerk và Lazy Sync user vào Database
 * Reference: https://clerk.com/docs/backend-requests/handling/nodejs
 */

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { verifyToken, type ClerkClient } from '@clerk/backend';
import { CLERK_CLIENT } from '../providers/clerk-client.provider';
import { UsersService } from '../../users/users/users.service';
import { User } from '@prisma/client';

/**
 * User Payload trả về từ strategy
 * Bao gồm cả thông tin từ Database (id UUID) và Clerk
 */
export type AuthenticatedUser = User;
// User đã có tất cả fields từ Prisma (id, clerkId, email, etc.)

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  private readonly secretKey: string;

  constructor(
    @Inject(CLERK_CLIENT) private readonly clerkClient: ClerkClient,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super();
    this.secretKey = this.configService.get<string>('CLERK_SECRET_KEY') || '';
  }

  async validate(req: Request): Promise<AuthenticatedUser> {
    try {
      // 1. Lấy token từ Authorization header
      const token = this.extractTokenFromHeader(req);

      if (!token) {
        throw new UnauthorizedException('No authentication token provided');
      }

      // 2. Verify JWT token với Clerk
      const payload = await verifyToken(token, {
        secretKey: this.secretKey,
      });

      const clerkId = payload.sub;

      if (!clerkId) {
        throw new UnauthorizedException('Invalid token: no user ID');
      }

      // 3. Lấy user info từ Clerk API
      const clerkUser = await this.clerkClient.users.getUser(clerkId);

      // 4. LAZY SYNC: Tạo hoặc cập nhật user trong Database
      const dbUser = await this.usersService.findOrCreateByClerkId({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        username: clerkUser.username || `user_${clerkUser.id.slice(-8)}`,
        displayName:
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
          null,
        avatar: clerkUser.imageUrl || null,
      });

      // 5. Return DB User (có id UUID để dùng trong các operations khác)
      return dbUser;
    } catch (error: unknown) {
      console.error('[ClerkStrategy] Authentication error:', error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        'Authentication failed: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  }

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');

    return type === 'Bearer' ? token : null;
  }
}
