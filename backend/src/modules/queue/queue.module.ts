import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAME } from './queue.constants';
import { ArtworkProcessor } from './processors/artwork.processor';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../../database/prisma.module';
import { SearchModule } from '../search/search.module';
import { DuplicateDetectionModule } from '../duplicate-detection/duplicate-detection.module';
import { AiSearchModule } from '../ai-search/ai-search.module';

@Module({
  imports: [
    // BullModule.forRootAsync() is now in AppModule (global)
    BullModule.registerQueue({
      name: QUEUE_NAME,
    }),
    StorageModule,
    PrismaModule,
    SearchModule,
    DuplicateDetectionModule,
    AiSearchModule,
  ],
  providers: [ArtworkProcessor],
  exports: [BullModule],
})
export class QueueModule { }
