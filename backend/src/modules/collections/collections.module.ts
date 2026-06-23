/**
 * Collections Module
 * Handle user collections (folders) for saving artworks
 */

import { Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { PrismaService } from '../../database/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CollectionsController],
  providers: [CollectionsService, PrismaService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
