/**
 * Users Service
 * Handle user operations including Lazy Sync with Clerk
 * Reference: https://docs.nestjs.com/providers
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
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
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Find or Create user by Clerk ID (Lazy Sync)
     * Được gọi mỗi khi user authenticate thành công
     * @param clerkData - Data từ Clerk API
     * @returns User record từ database
     */
    async findOrCreateByClerkId(clerkData: ClerkUserData): Promise<User> {
        const { clerkId, email, username, displayName, avatar } = clerkData;

        return this.prisma.user.upsert({
            where: { clerkId },
            update: {
                // Update các field có thể thay đổi
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
}
