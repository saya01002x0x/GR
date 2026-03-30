/**
 * View Service
 * Handle view counting with Redis spam protection
 * - Unique-ish: 1 view per user/IP per 10 minutes
 * - Performance: Redis INCR → BullMQ Job → Async DB flush
 * Reference: https://docs.nestjs.com/providers
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../database/redis.constants';
import {
  STATS_QUEUE_NAME,
  JOB_UPDATE_STATS,
  VIEW_LOCK_PREFIX,
  VIEW_COUNT_PREFIX,
  VIEW_LOCK_TTL,
  UpdateStatsJob,
} from './stats.constants';

@Injectable()
export class ViewService {
  private readonly logger = new Logger(ViewService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue(STATS_QUEUE_NAME) private readonly statsQueue: Queue,
  ) {}

  /**
   * Record a view on an artwork
   * @param artworkId - The artwork being viewed
   * @param userId - Logged-in user ID (if available)
   * @param ip - Client IP address (for guests)
   * @returns true if view was counted, false if spam-blocked
   */
  async recordView(
    artworkId: string,
    userId?: string,
    ip?: string,
  ): Promise<boolean> {
    // Build identity key: prefer userId, fallback to IP
    const identity = userId || ip || 'unknown';
    const lockKey = `${VIEW_LOCK_PREFIX}:${artworkId}:${identity}`;

    try {
      // SET NX EX 600 — only set if key doesn't exist, TTL 10 minutes
      const wasSet = await this.redis.set(
        lockKey,
        '1',
        'EX',
        VIEW_LOCK_TTL,
        'NX',
      );

      if (!wasSet) {
        // Key already exists → spam protection, skip
        this.logger.debug(
          `View blocked (spam): artwork=${artworkId}, identity=${identity}`,
        );
        return false;
      }

      // Increment view count in Redis
      const countKey = `${VIEW_COUNT_PREFIX}:${artworkId}`;
      await this.redis.incr(countKey);

      // Push async job to update DB counter
      const jobData: UpdateStatsJob = {
        artworkId,
        type: 'view',
        delta: 1,
      };

      await this.statsQueue.add(JOB_UPDATE_STATS, jobData, {
        // View jobs don't need strict dedup — sai số 1-2 chấp nhận được
        removeOnComplete: true,
        removeOnFail: 100,
      });

      this.logger.debug(
        `View recorded: artwork=${artworkId}, identity=${identity}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to record view for artwork ${artworkId}`,
        error,
      );
      return false;
    }
  }
}
