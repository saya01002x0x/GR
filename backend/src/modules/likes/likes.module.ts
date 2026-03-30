/**
 * Likes Module
 * Handle artwork like/unlike operations
 * Registers stats-queue directly for @InjectQueue access
 * Reference: docs/HOWTO_NESTJS_MODULES.md
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { STATS_QUEUE_NAME } from '../stats/stats.constants';

@Module({
    imports: [
        BullModule.registerQueue({
            name: STATS_QUEUE_NAME,
        }),
    ],
    controllers: [LikesController],
    providers: [LikesService],
    exports: [LikesService],
})
export class LikesModule {}
