/**
 * Artworks Module
 * Handle artwork operations
 * Reference: https://docs.nestjs.com/modules
 */

import { Module } from '@nestjs/common';
import { ArtworksService } from './artworks.service';
import { ArtworksController } from './artworks.controller';
import { PrismaModule } from '../../database';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../queue/queue.module';
import { StatsModule } from '../stats/stats.module';

@Module({
  imports: [PrismaModule, StorageModule, AuthModule, QueueModule, StatsModule],
  controllers: [ArtworksController],
  providers: [ArtworksService],
  exports: [ArtworksService],
})
export class ArtworksModule { }
