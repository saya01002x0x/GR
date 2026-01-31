/**
 * Likes Service
 * Handle like/unlike toggle operations
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LikesService {
    private readonly logger = new Logger(LikesService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Toggle like on artwork
     * Returns: { liked: boolean, likeCount: number }
     */
    async toggleLike(userId: string, artworkId: string) {
        // Check if already liked
        const existingLike = await this.prisma.like.findUnique({
            where: {
                userId_artworkId: { userId, artworkId },
            },
        });

        if (existingLike) {
            // Unlike: delete and decrement count
            await this.prisma.$transaction([
                this.prisma.like.delete({
                    where: { userId_artworkId: { userId, artworkId } },
                }),
                this.prisma.artwork.update({
                    where: { id: artworkId },
                    data: { likeCount: { decrement: 1 } },
                }),
            ]);

            this.logger.log(`User ${userId} unliked artwork ${artworkId}`);

            const artwork = await this.prisma.artwork.findUnique({
                where: { id: artworkId },
                select: { likeCount: true },
            });

            return { liked: false, likeCount: artwork?.likeCount || 0 };
        } else {
            // Like: create and increment count
            await this.prisma.$transaction([
                this.prisma.like.create({
                    data: { userId, artworkId },
                }),
                this.prisma.artwork.update({
                    where: { id: artworkId },
                    data: { likeCount: { increment: 1 } },
                }),
            ]);

            this.logger.log(`User ${userId} liked artwork ${artworkId}`);

            const artwork = await this.prisma.artwork.findUnique({
                where: { id: artworkId },
                select: { likeCount: true },
            });

            return { liked: true, likeCount: artwork?.likeCount || 0 };
        }
    }

    /**
     * Check if user liked an artwork
     */
    async getLikeStatus(userId: string, artworkId: string) {
        const like = await this.prisma.like.findUnique({
            where: {
                userId_artworkId: { userId, artworkId },
            },
        });

        const artwork = await this.prisma.artwork.findUnique({
            where: { id: artworkId },
            select: { likeCount: true },
        });

        return {
            liked: !!like,
            likeCount: artwork?.likeCount || 0,
        };
    }
}
