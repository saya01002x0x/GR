/**
 * Comments Module
 * Handle artwork comments with nested replies
 */

import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
    controllers: [CommentsController],
    providers: [CommentsService, PrismaService],
    exports: [CommentsService],
})
export class CommentsModule { }
