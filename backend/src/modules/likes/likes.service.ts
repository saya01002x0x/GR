/**
 * Likes Service
 * Handle like/unlike toggle operations
 * Refactored: counter update moved to async BullMQ job
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import {
  STATS_QUEUE_NAME,
  JOB_UPDATE_STATS,
  UpdateStatsJob,
} from '../stats/stats.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LikesService {
  private readonly logger = new Logger(LikesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(STATS_QUEUE_NAME) private readonly statsQueue: Queue,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Toggle like on artwork
   * ACID: Only the Like record write is synchronous
   * Counter update: pushed to BullMQ for async processing
   * Returns: { liked: boolean, likeCount: number } (real count from Like table)
   */
  async toggleLike(userId: string, artworkId: string) {
    // Check if already liked
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_artworkId: { userId, artworkId },
      },
    });

    if (existingLike) {
      // Unlike: delete Like record (ACID)
      await this.prisma.like.delete({
        where: { userId_artworkId: { userId, artworkId } },
      });

      // Push async counter decrement (best-effort, reconciliation cron will fix drift)
      try {
        const jobData: UpdateStatsJob = {
          artworkId,
          type: 'like',
          delta: -1,
        };

        await this.statsQueue.add(JOB_UPDATE_STATS, jobData, {
          jobId: `like-${userId}-${artworkId}-unlike-${Date.now()}`,
          removeOnComplete: true,
          removeOnFail: 100,
        });
        this.logger.log(`✅ Queued unlike stats job for artwork ${artworkId}`);
      } catch (queueError: unknown) {
        this.logger.error(
          `❌ Failed to queue unlike stats for ${artworkId}:`,
          queueError instanceof Error ? queueError.message : String(queueError),
        );
      }

      this.logger.log(`User ${userId} unliked artwork ${artworkId}`);

      // Count actual likes from source of truth (Like table)
      const likeCount = await this.prisma.like.count({
        where: { artworkId },
      });

      return {
        liked: false,
        likeCount,
      };
    } else {
      // Like: create Like record (ACID)
      await this.prisma.like.create({
        data: { userId, artworkId },
      });

      // Push async counter increment (best-effort, reconciliation cron will fix drift)
      try {
        const jobData: UpdateStatsJob = {
          artworkId,
          type: 'like',
          delta: 1,
        };

        await this.statsQueue.add(JOB_UPDATE_STATS, jobData, {
          jobId: `like-${userId}-${artworkId}-like-${Date.now()}`,
          removeOnComplete: true,
          removeOnFail: 100,
        });
        this.logger.log(`✅ Queued like stats job for artwork ${artworkId}`);
      } catch (queueError: unknown) {
        this.logger.error(
          `❌ Failed to queue like stats for ${artworkId}:`,
          queueError instanceof Error ? queueError.message : String(queueError),
        );
      }

      // Notify artwork author immediately so this does not depend on the
      // delayed notification worker being available.
      try {
        const [artwork, user] = await Promise.all([
          this.prisma.artwork.findUnique({
            where: { id: artworkId },
            select: { authorId: true, title: true },
          }),
          this.prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          }),
        ]);

        if (artwork && user && artwork.authorId !== userId) {
          this.eventEmitter.emit('artwork.liked', {
            authorId: artwork.authorId,
            artworkId,
            artworkTitle: artwork.title,
            user,
          });
        }
      } catch (err) {
        this.logger.error(
          'Failed to send like notification',
          err instanceof Error ? err.message : String(err),
        );
      }

      this.logger.log(`User ${userId} liked artwork ${artworkId}`);

      // Count actual likes from source of truth (Like table)
      const likeCount = await this.prisma.like.count({
        where: { artworkId },
      });

      return {
        liked: true,
        likeCount,
      };
    }
  }

  /**
   * Check if user liked an artwork
   * Uses COUNT(*) from Like table (source of truth)
   * instead of denormalized artwork.likeCount
   */
  async getLikeStatus(userId: string, artworkId: string) {
    const [like, likeCount] = await Promise.all([
      this.prisma.like.findUnique({
        where: {
          userId_artworkId: { userId, artworkId },
        },
      }),
      this.prisma.like.count({
        where: { artworkId },
      }),
    ]);

    return {
      liked: !!like,
      likeCount,
    };
  }
}
