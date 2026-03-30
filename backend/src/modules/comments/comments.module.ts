/**
 * Comments Module
 * Handle artwork comments with nested replies
 * Registers stats-queue directly for @InjectQueue access
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { STATS_QUEUE_NAME } from '../stats/stats.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: STATS_QUEUE_NAME,
    }),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
