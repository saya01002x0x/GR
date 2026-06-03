/**
 * AI Search Service
 * Semantic search using Gemini embeddings + pgvector
 * Features:
 * - Text-to-vector search with Redis caching
 * - Sketch-to-vector search (Premium only)
 */

import {
  Injectable,
  Logger,
  Inject,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmbeddingService } from './embedding.service';
import { REDIS_CLIENT } from '../../database/redis.constants';
import Redis from 'ioredis';

export interface VectorSearchResult {
  artwork_id: string;
  similarity: number;
}

@Injectable()
export class AiSearchService {
  private readonly logger = new Logger(AiSearchService.name);

  /** Cache TTL: 7 days in seconds */
  private readonly CACHE_TTL = 7 * 24 * 3600;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Search artworks by natural language text query
   * Uses Redis cache to avoid redundant API calls
   * Flow: query -> cache check -> embed (if miss) -> pgvector search
   */
  async searchByText(
    query: string,
    limit = 20,
  ): Promise<VectorSearchResult[]> {
    if (!this.embeddingService.isAvailable()) {
      throw new BadRequestException('AI Search is not available. GEMINI_API_KEY not configured.');
    }

    const normalizedQuery = query.toLowerCase().trim();
    const cacheKey = `search:vector:${normalizedQuery}`;

    // 1. Check Redis cache
    let embedding: number[] | null = null;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      this.logger.debug(`Cache HIT for query: "${normalizedQuery}"`);
      embedding = JSON.parse(cached);
    } else {
      this.logger.debug(`Cache MISS for query: "${normalizedQuery}". Calling Gemini...`);
      embedding = await this.embeddingService.getTextEmbedding(normalizedQuery);

      // Store in Redis with TTL
      await this.redis.set(cacheKey, JSON.stringify(embedding), 'EX', this.CACHE_TTL);
    }

    if (!embedding) {
      throw new Error('Failed to retrieve or generate embedding');
    }

    // 2. Query pgvector (Cosine Distance: <=>)
    const vectorStr = `[${embedding.join(',')}]`;
    const results = await this.prisma.$queryRawUnsafe<VectorSearchResult[]>(
      `SELECT DISTINCT ON (ai.artwork_id)
         ai.artwork_id,
         1 - (ai.embedding <=> $1::vector) AS similarity
       FROM artwork_images ai
       WHERE ai.embedding IS NOT NULL
       ORDER BY ai.artwork_id, ai.embedding <=> $1::vector
       LIMIT $2`,
      vectorStr,
      limit,
    );

    return results;
  }

  /**
   * Search artworks by sketch image (Premium only)
   * Requires active subscription to use
   * Flow: check premium -> embed sketch -> pgvector search
   */
  async searchBySketch(
    userId: string,
    base64Image: string,
    limit = 10,
  ): Promise<VectorSearchResult[]> {
    if (!this.embeddingService.isAvailable()) {
      throw new BadRequestException('AI Search is not available. GEMINI_API_KEY not configured.');
    }

    // 1. Check Premium subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!subscription) {
      throw new ForbiddenException(
        'Sketch Search requires a Premium subscription. Please upgrade your plan.',
      );
    }

    // 2. Generate image embedding via Gemini
    this.logger.log(`Generating sketch embedding for user ${userId}`);
    const embedding = await this.embeddingService.getImageEmbedding(base64Image);

    // 3. Query pgvector
    const vectorStr = `[${embedding.join(',')}]`;
    const results = await this.prisma.$queryRawUnsafe<VectorSearchResult[]>(
      `SELECT DISTINCT ON (ai.artwork_id)
         ai.artwork_id,
         1 - (ai.embedding <=> $1::vector) AS similarity
       FROM artwork_images ai
       WHERE ai.embedding IS NOT NULL
         AND 1 - (ai.embedding <=> $1::vector) > 0.3
       ORDER BY ai.artwork_id, ai.embedding <=> $1::vector
       LIMIT $2`,
      vectorStr,
      limit,
    );

    return results;
  }

  /**
   * Store embedding for an artwork image (called during upload processing)
   */
  async storeImageEmbedding(
    imageId: string,
    embedding: number[],
  ): Promise<void> {
    const vectorStr = `[${embedding.join(',')}]`;
    await this.prisma.$queryRawUnsafe(
      `UPDATE artwork_images SET embedding = $1::vector WHERE id = $2`,
      vectorStr,
      imageId,
    );
    this.logger.debug(`Stored embedding for image ${imageId}`);
  }
}
