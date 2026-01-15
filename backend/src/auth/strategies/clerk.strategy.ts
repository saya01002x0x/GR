/**
 * Clerk Passport Strategy
 * Verify JWT token từ Clerk
 * 
 * TODO: Implement proper JWT verification
 * Reference: https://clerk.com/docs/backend-requests/handling/nodejs
 * 
 * NOTE: This is a basic implementation for development.
 * For production, implement proper JWT verification using @clerk/backend
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  async validate(req: Request): Promise<any> {
    try {
      // Lấy token từ Authorization header
      const token = this.extractTokenFromHeader(req);

      if (!token) {
        throw new UnauthorizedException('No authentication token provided');
      }

      // TODO: Implement JWT verification với Clerk
      // For now, return mock user for development
      console.log('[ClerkStrategy] Token received (mock auth for dev)');

      // Return mock user object để attach vào request
      return {
        userId: 'dev_user_123',
        email: 'dev@example.com',
        firstName: 'Dev',
        lastName: 'User',
        fullName: 'Dev User',
        metadata: { role: 'member' },
      };
    } catch (error) {
      console.error('[ClerkStrategy] Authentication error:', error);
      throw new UnauthorizedException(
        'Authentication failed: ' + (error?.message || 'Unknown error'),
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
