/**
 * Likes Module
 * Handle artwork like/unlike operations
 * Uses StatsModule for async counter updates
 * Reference: docs/HOWTO_NESTJS_MODULES.md
 */

import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { StatsModule } from '../stats/stats.module';

@Module({
    imports: [StatsModule],
    controllers: [LikesController],
    providers: [LikesService],
    exports: [LikesService],
})
export class LikesModule {}
