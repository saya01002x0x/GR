/**
 * Comments Service
 * Handle comment CRUD with nested replies
 * Refactored: counter update moved to async BullMQ job
 * API returns flat list by parentId, frontend renders recursively
 */

import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import {
    STATS_QUEUE_NAME,
    JOB_UPDATE_STATS,
    UpdateStatsJob,
} from '../stats/stats.constants';

export interface CreateCommentDto {
    content: string;
    parentId?: string; // For replies
}

@Injectable()
export class CommentsService {
    private readonly logger = new Logger(CommentsService.name);

    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue(STATS_QUEUE_NAME) private readonly statsQueue: Queue,
    ) {}

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
     * ACID: Only the Comment record write is synchronous
     * Counter update: pushed to BullMQ for async processing
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

        // Create comment (ACID — no transaction needed for single write)
        const comment = await this.prisma.comment.create({
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
        });

        // Push async counter increment (best-effort, reconciliation cron will fix drift)
        try {
            const jobData: UpdateStatsJob = {
                artworkId,
                type: 'comment',
                delta: 1,
            };

            await this.statsQueue.add(JOB_UPDATE_STATS, jobData, {
                jobId: `comment-${comment.id}-created`,
                removeOnComplete: true,
                removeOnFail: 100,
            });
        } catch (queueError) {
            this.logger.error(`Failed to queue comment stats for ${artworkId}`, queueError);
        }

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
     * Counter update: pushed to BullMQ for async processing
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

        // Delete comment (cascade deletes replies via Prisma)
        await this.prisma.comment.delete({
            where: { id: commentId },
        });

        // Push async counter decrement (best-effort, reconciliation cron will fix drift)
        try {
            const jobData: UpdateStatsJob = {
                artworkId: comment.artworkId,
                type: 'comment',
                delta: -totalToDelete,
            };

            await this.statsQueue.add(JOB_UPDATE_STATS, jobData, {
                jobId: `comment-${commentId}-deleted`,
                removeOnComplete: true,
                removeOnFail: 100,
            });
        } catch (queueError) {
            this.logger.error(`Failed to queue comment delete stats for ${comment.artworkId}`, queueError);
        }

        this.logger.log(`User ${userId} deleted comment ${commentId}`);

        return { deleted: true };
    }
}
