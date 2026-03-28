/**
 * Likes Module
 * Handle artwork like/unlike operations
 * Reference: docs/HOWTO_NESTJS_MODULES.md
 */

import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
    controllers: [LikesController],
    providers: [LikesService, PrismaService],
    exports: [LikesService],
})
export class LikesModule { }
