/**
 * Stats Module
 * Hybrid counter system for View, Like, Comment
 * - ViewService: Redis spam protection + async DB flush
 * - StatsProcessor: BullMQ worker for counter updates
 * - MeilisearchSyncService: Batched partial updates
 * - ReconciliationTask: Daily 3AM cron to fix drift
 * Reference: https://docs.nestjs.com/modules
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ViewService } from './view.service';
import { StatsProcessor } from './stats.processor';
import { MeilisearchSyncService } from './meilisearch-sync.service';
import { ReconciliationTask } from './reconciliation.task';
import { SearchModule } from '../search/search.module';
import { STATS_QUEUE_NAME } from './stats.constants';

@Module({
    imports: [
        BullModule.registerQueue({
            name: STATS_QUEUE_NAME,
        }),
        SearchModule,
    ],
    providers: [
        ViewService,
        StatsProcessor,
        MeilisearchSyncService,
        ReconciliationTask,
    ],
    exports: [ViewService, BullModule],
})
export class StatsModule {}
