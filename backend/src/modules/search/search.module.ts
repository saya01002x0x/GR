/**
 * Search Module
 * Meilisearch integration for artwork search
 * Reference: https://docs.nestjs.com/modules
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [ConfigModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService], // Export for use in QueueModule
})
export class SearchModule {}
