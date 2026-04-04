/**
 * Users Service
 * Handle user operations including Lazy Sync with Clerk
 * Reference: https://docs.nestjs.com/providers
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { User } from '@prisma/client';

export interface ClerkUserData {
  clerkId: string;
  email: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find or Create user by Clerk ID (Lazy Sync)
   * ﾄ脆ｰ盻｣c g盻絞 m盻擁 khi user authenticate thﾃnh cﾃｴng
   * @param clerkData - Data t盻ｫ Clerk API
   * @returns User record t盻ｫ database
   */
  async findOrCreateByClerkId(clerkData: ClerkUserData): Promise<User> {
    const { clerkId, email, username, displayName, avatar } = clerkData;

    return this.prisma.user.upsert({
      where: { clerkId },
      update: {
        // Update cﾃ｡c field cﾃｳ th盻・thay ﾄ黛ｻ品
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

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by Clerk ID
   */
  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { clerkId },
    });
  }

  /**
   * Become an Artist
   * Update isArtist flag to true
   */
  async becomeArtist(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isArtist: true },
    });
  }

  /**
   * Get list of artists with their artwork count
   */
  async findArtists(limit = 10) {
    return this.prisma.user.findMany({
      where: { isArtist: true },
      include: {
        _count: {
          select: { artworks: true },
        },
      },
      take: limit,
    });
  }
}
