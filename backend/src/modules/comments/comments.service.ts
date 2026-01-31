/**
 * Comments Service
 * Handle comment CRUD with nested replies
 * API returns flat list by parentId, frontend renders recursively
 */

import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateCommentDto {
    content: string;
    parentId?: string; // For replies
}

@Injectable()
export class CommentsService {
    private readonly logger = new Logger(CommentsService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get comments for artwork (flat list by parentId)
     * @param parentId - null for root comments, or comment ID for replies
     * @param limit - default 3 per load
     * @param offset - for pagination
     */
    async getComments(
        artworkId: string,
        parentId: string | null = null,
        limit = 3,
        offset = 0,
    ) {
        const where = {
            artworkId,
            parentId: parentId || null,
        };

        const [comments, total] = await Promise.all([
            this.prisma.comment.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatar: true,
                        },
                    },
                    _count: {
                        select: { replies: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.comment.count({ where }),
        ]);

        // Transform to include replyCount
        const transformedComments = comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            parentId: comment.parentId,
            createdAt: comment.createdAt,
            user: comment.user,
            replyCount: comment._count.replies,
        }));

        return {
            comments: transformedComments,
            hasMore: offset + comments.length < total,
            total,
        };
    }

    /**
     * Create a new comment or reply
     */
    async createComment(
        userId: string,
        artworkId: string,
        dto: CreateCommentDto,
    ) {
        // Verify artwork exists
        const artwork = await this.prisma.artwork.findUnique({
            where: { id: artworkId },
        });

        if (!artwork) {
            throw new NotFoundException('Artwork not found');
        }

        // If replying, verify parent comment exists
        if (dto.parentId) {
            const parentComment = await this.prisma.comment.findUnique({
                where: { id: dto.parentId },
            });
            if (!parentComment) {
                throw new NotFoundException('Parent comment not found');
            }
        }

        // Create comment and increment count
        const [comment] = await this.prisma.$transaction([
            this.prisma.comment.create({
                data: {
                    content: dto.content,
                    userId,
                    artworkId,
                    parentId: dto.parentId || null,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatar: true,
                        },
                    },
                },
            }),
            this.prisma.artwork.update({
                where: { id: artworkId },
                data: { commentCount: { increment: 1 } },
            }),
        ]);

        this.logger.log(`User ${userId} commented on artwork ${artworkId}`);

        return {
            id: comment.id,
            content: comment.content,
            parentId: comment.parentId,
            createdAt: comment.createdAt,
            user: comment.user,
            replyCount: 0,
        };
    }

    /**
     * Delete a comment (only by owner)
     * Cascade deletes replies
     */
    async deleteComment(userId: string, commentId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                _count: { select: { replies: true } },
            },
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.userId !== userId) {
            throw new ForbiddenException('You can only delete your own comments');
        }

        // Count total comments to delete (including replies)
        const replyCount = comment._count.replies;
        const totalToDelete = 1 + replyCount;

        // Delete comment (cascade deletes replies) and decrement count
        await this.prisma.$transaction([
            this.prisma.comment.delete({
                where: { id: commentId },
            }),
            this.prisma.artwork.update({
                where: { id: comment.artworkId },
                data: { commentCount: { decrement: totalToDelete } },
            }),
        ]);

        this.logger.log(`User ${userId} deleted comment ${commentId}`);

        return { deleted: true };
    }
}
