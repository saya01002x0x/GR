/**
 * Comments Module
 * Handle artwork comments with nested replies
 * Uses StatsModule for async counter updates
 */

import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { StatsModule } from '../stats/stats.module';

@Module({
    imports: [StatsModule],
    controllers: [CommentsController],
    providers: [CommentsService],
    exports: [CommentsService],
})
export class CommentsModule {}
