import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken, type ClerkClient } from '@clerk/backend';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CLERK_CLIENT } from './clerk-client.provider';

export interface ClerkUserData {
  clerkId: string;
  email: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(CLERK_CLIENT) private readonly clerkClient: ClerkClient,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
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

      const existingUser = await this.prisma.user.findUnique({
        where: { clerkId: payload.sub },
      });
      if (existingUser) {
        return existingUser;
      }

      const clerkUser = await this.clerkClient.users.getUser(payload.sub);

      return this.findOrCreateUser({
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

  async findOrCreateUser(clerkData: ClerkUserData): Promise<User> {
    const { clerkId, email, username, displayName, avatar } = clerkData;

    return this.prisma.user.upsert({
      where: { clerkId },
      update: {
        displayName: displayName || undefined,
        avatar: avatar || undefined,
      },
      create: {
        clerkId,
        email,
        username,
        displayName,
        avatar,
      },
    });
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
