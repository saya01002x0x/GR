/**
 * AI Search Module
 * Semantic search using Gemini embeddings + pgvector
 * Includes text search and sketch search (premium only)
 */
import { Module } from '@nestjs/common';
import { AiSearchService } from './ai-search.service';
import { AiSearchController } from './ai-search.controller';
import { EmbeddingService } from './embedding.service';
import { PrismaModule } from '../../database';

@Module({
  imports: [PrismaModule],
  controllers: [AiSearchController],
  providers: [AiSearchService, EmbeddingService],
  exports: [AiSearchService, EmbeddingService],
})
export class AiSearchModule {}
