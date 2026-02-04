/**
 * Artworks Module
 * Handle artwork operations
 * Reference: https://docs.nestjs.com/modules
 */

import { Module } from '@nestjs/common';
import { ArtworksService } from '../artworks.service';
import { ArtworksController } from '../artworks.controller';
import { PrismaModule } from '../../../database';
import { StorageModule } from '../../storage/storage/storage.module';
import { AuthModule } from '../../auth/auth.module';
import { QueueModule } from '../../queue/queue.module';

@Module({
    imports: [PrismaModule, StorageModule, AuthModule, QueueModule],
    controllers: [ArtworksController],
    providers: [ArtworksService],
    exports: [ArtworksService],
})
export class ArtworksModule { }
