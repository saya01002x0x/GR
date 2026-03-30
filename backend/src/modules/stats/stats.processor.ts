/**
 * Stats Processor
 * BullMQ worker that processes counter update jobs
 * - Increments counters in Postgres
 * - Buffers Meilisearch partial updates
 * Reference: https://docs.nestjs.com/techniques/queues
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import Redis from 'ioredis';
import { PrismaService } from '../../database/prisma.service';
import { REDIS_CLIENT } from '../../database/redis.constants';
import { MeilisearchSyncService } from './meilisearch-sync.service';
import {
    STATS_QUEUE_NAME,
    JOB_UPDATE_STATS,
    VIEW_COUNT_PREFIX,
    UpdateStatsJob,
} from './stats.constants';

import * as Sentry from '@sentry/nestjs';

@Processor(STATS_QUEUE_NAME, {
    concurrency: 5, // Process up to 5 stats jobs concurrently
})
export class StatsProcessor extends WorkerHost {
    private readonly logger = new Logger(StatsProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        private readonly meiliSync: MeilisearchSyncService,
    ) {
        super();
    }

    async process(job: Job<UpdateStatsJob>): Promise<any> {
        const { artworkId, type, delta } = job.data;

        this.logger.log(`🔧 Processing ${type} stats for artwork ${artworkId} (delta: ${delta}, jobId: ${job.id})`);

        try {
            // Determine which counter field to update
            const counterField = this.getCounterField(type);

            if (type === 'view') {
                // For views: use GETDEL to atomically read + delete Redis counter
                // This prevents race conditions where new views arrive between read and reset
                const countKey = `${VIEW_COUNT_PREFIX}:${artworkId}`;
                const redisCount = await this.redis.getdel(countKey);
                const actualDelta = redisCount ? parseInt(redisCount, 10) : delta;

                if (actualDelta > 0) {
                    await this.prisma.artwork.update({
                        where: { id: artworkId },
                        data: { [counterField]: { increment: actualDelta } },
                    });

                    // Buffer Meilisearch update with actual DB value
                    const artwork = await this.prisma.artwork.findUnique({
                        where: { id: artworkId },
                        select: { viewCount: true },
                    });

                    if (artwork) {
                        await this.meiliSync.bufferUpdate(artworkId, {
                            viewCount: artwork.viewCount,
                        });
                    }
                }
            } else {
                // For likes/comments: simple atomic increment
                const updated = await this.prisma.artwork.update({
                    where: { id: artworkId },
                    data: { [counterField]: { increment: delta } },
                });

                // Buffer Meilisearch update with actual DB value
                await this.meiliSync.bufferUpdate(artworkId, {
                    [counterField]: updated[counterField],
                });
            }

            this.logger.debug(`Stats updated: artwork=${artworkId}, ${type} += ${delta}`);
            return { success: true };
        } catch (error) {
            Sentry.captureException(error);
            this.logger.error(
                `Failed to update ${type} stats for artwork ${artworkId}`,
                error,
            );
            throw error; // Let BullMQ handle retry
        }
    }

    /**
     * Map stat type to Prisma field name
     */
    private getCounterField(type: 'view' | 'like' | 'comment'): string {
        const map: Record<string, string> = {
            view: 'viewCount',
            like: 'likeCount',
            comment: 'commentCount',
        };
        return map[type];
    }
}
