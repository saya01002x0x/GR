/**
 * Clerk Passport Strategy
 * Verify JWT token từ Clerk
 * Reference: https://clerk.com/docs/backend-requests/handling/nodejs
 */

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { verifyToken, type ClerkClient } from '@clerk/backend';
import { CLERK_CLIENT } from '../providers/clerk-client.provider';

export interface ClerkUserPayload {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string | null;
  metadata: Record<string, unknown>;
}

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  private readonly secretKey: string;

  constructor(
    @Inject(CLERK_CLIENT) private readonly clerkClient: ClerkClient,
    private readonly configService: ConfigService,
  ) {
    super();
    this.secretKey = this.configService.get<string>('CLERK_SECRET_KEY') || '';
  }

  async validate(req: Request): Promise<ClerkUserPayload> {
    try {
      // Lấy token từ Authorization header
      const token = this.extractTokenFromHeader(req);

      if (!token) {
        throw new UnauthorizedException('No authentication token provided');
      }

      // Verify JWT token với Clerk (standalone function)
      const payload = await verifyToken(token, {
        secretKey: this.secretKey,
      });

      const userId = payload.sub;

      if (!userId) {
        throw new UnauthorizedException('Invalid token: no user ID');
      }

      // Lấy user info từ Clerk
      const user = await this.clerkClient.users.getUser(userId);

      // Return user payload để attach vào request
      return {
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress || null,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
        imageUrl: user.imageUrl,
        metadata: {
          role: (user.publicMetadata?.role as string) || 'member',
          ...user.publicMetadata,
        },
      };
    } catch (error) {
      console.error('[ClerkStrategy] Authentication error:', error);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }

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
