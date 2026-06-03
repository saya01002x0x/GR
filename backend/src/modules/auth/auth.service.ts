import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken, type ClerkClient } from '@clerk/backend';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { CLERK_CLIENT } from './clerk-client.provider';

@Injectable()
export class AuthService {
  constructor(
    @Inject(CLERK_CLIENT) private readonly clerkClient: ClerkClient,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async getOptionalUser(request: Request): Promise<User | null> {
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      return null;
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: this.configService.get<string>('CLERK_SECRET_KEY') || '',
      });

      if (!payload.sub) {
        return null;
      }

      const existingUser = await this.usersService.findByClerkId(payload.sub);
      if (existingUser) {
        return existingUser;
      }

      const clerkUser = await this.clerkClient.users.getUser(payload.sub);

      return this.usersService.findOrCreateByClerkId({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        username: clerkUser.username || `user_${clerkUser.id.slice(-8)}`,
        displayName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
        avatar: clerkUser.imageUrl || null,
      });
    } catch {
      return null;
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
