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

export interface AiSearchResult {
  id: string;
  title: string;
  description: string;
  slug: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  thumbnail: string;
  tags: string[];
  rating: string;
  isAI: boolean;
  createdAt: number;
  likeCount: number;
  viewCount: number;
  ratioClass: string;
  maxResolution: number;
  isHighRes: boolean;
  similarity: number;
}

@Injectable()
export class AiSearchService {
  private readonly logger = new Logger(AiSearchService.name);

  /** Cache TTL: 7 days in seconds */
  private readonly CACHE_TTL = 7 * 24 * 3600;
  private readonly EMBEDDING_DIMENSION = 512;
  private readonly VECTOR_CACHE_VERSION = `clip-${this.EMBEDDING_DIMENSION}`;
  private readonly TEXT_MIN_SIMILARITY = 0.25;
  private readonly SKETCH_MIN_SIMILARITY = 0.3;

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
    userId?: string,
    ip?: string,
  ): Promise<AiSearchResult[]> {
    if (!this.embeddingService.isAvailable()) {
      throw new BadRequestException('AI Search is not available. GEMINI_API_KEY not configured.');
    }

    // Check rate limit
    await this.checkRateLimit(userId, ip, 'text');

    const normalizedQuery = query.toLowerCase().trim();
    const cacheKey = `search:vector:${this.VECTOR_CACHE_VERSION}:${normalizedQuery}`;
    const legacyCacheKey = `search:vector:${normalizedQuery}`;

    // 1. Check Redis cache
    let embedding: number[] | null = null;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      this.logger.debug(`Cache HIT for query: "${normalizedQuery}"`);
      embedding = this.parseCachedEmbedding(cached);
    } else {
      const legacyCached = await this.redis.get(legacyCacheKey);
      if (legacyCached) {
        const legacyEmbedding = this.parseCachedEmbedding(legacyCached);
        if (legacyEmbedding) {
          embedding = legacyEmbedding;
          await this.redis.set(cacheKey, JSON.stringify(embedding), 'EX', this.CACHE_TTL);
        } else {
          await this.redis.del(legacyCacheKey);
        }
      }
    }

    if (!embedding) {
      this.logger.debug(`Cache MISS for query: "${normalizedQuery}". Calling Gemini...`);
      embedding = await this.embeddingService.getTextEmbedding(normalizedQuery);
      this.assertEmbeddingDimension(embedding, 'text search');

      // Store in Redis with TTL
      await this.redis.set(cacheKey, JSON.stringify(embedding), 'EX', this.CACHE_TTL);
    }

    if (!embedding) {
      throw new Error('Failed to retrieve or generate embedding');
    }

    // Increment usage
    await this.incrementUsage(userId, ip, 'text');

    // 2. Query pgvector (Cosine Distance: <=>)
    const vectorStr = `[${embedding.join(',')}]`;
    const results = await this.prisma.$queryRawUnsafe<VectorSearchResult[]>(
      `WITH nearest_image_per_artwork AS (
         SELECT DISTINCT ON (ai.artwork_id)
           ai.artwork_id,
           1 - (ai.embedding <=> $1::vector) AS similarity
         FROM artwork_images ai
         WHERE ai.embedding IS NOT NULL
         ORDER BY ai.artwork_id, ai.embedding <=> $1::vector
       )
       SELECT artwork_id, similarity
       FROM nearest_image_per_artwork
       WHERE similarity > $3
       ORDER BY similarity DESC
       LIMIT $2`,
      vectorStr,
      limit,
      this.TEXT_MIN_SIMILARITY,
    );

    return this.hydrateVectorResults(results);
  }

  /**
   * Search artworks by sketch image
   */
  async searchBySketch(
    userId: string,
    base64Image: string,
    limit = 10,
  ): Promise<AiSearchResult[]> {
    if (!this.embeddingService.isAvailable()) {
      throw new BadRequestException('AI Search is not available. GEMINI_API_KEY not configured.');
    }

    // Check rate limit
    await this.checkRateLimit(userId, null, 'sketch');

    // 2. Generate image embedding via Gemini
    this.logger.log(`Generating sketch embedding for user ${userId}`);
    const embedding = await this.embeddingService.getImageEmbedding(base64Image);
    this.assertEmbeddingDimension(embedding, 'sketch search');
    
    // Increment usage
    await this.incrementUsage(userId, null, 'sketch');

    // 3. Query pgvector
    const vectorStr = `[${embedding.join(',')}]`;
    const results = await this.prisma.$queryRawUnsafe<VectorSearchResult[]>(
      `WITH nearest_image_per_artwork AS (
         SELECT DISTINCT ON (ai.artwork_id)
           ai.artwork_id,
           1 - (ai.embedding <=> $1::vector) AS similarity
         FROM artwork_images ai
         WHERE ai.embedding IS NOT NULL
         ORDER BY ai.artwork_id, ai.embedding <=> $1::vector
       )
       SELECT artwork_id, similarity
       FROM nearest_image_per_artwork
       WHERE similarity > $3
       ORDER BY similarity DESC
       LIMIT $2`,
      vectorStr,
      limit,
      this.SKETCH_MIN_SIMILARITY,
    );

    return this.hydrateVectorResults(results);
  }

  /**
   * Store embedding for an artwork image (called during upload processing)
   */
  async storeImageEmbedding(
    imageId: string,
    embedding: number[],
  ): Promise<void> {
    this.assertEmbeddingDimension(embedding, `image ${imageId}`);
    const vectorStr = `[${embedding.join(',')}]`;
    await this.prisma.$queryRawUnsafe(
      `UPDATE artwork_images SET embedding = $1::vector, has_embedding = true WHERE id = $2`,
      vectorStr,
      imageId,
    );
    this.logger.debug(`Stored embedding for image ${imageId}`);
  }

  private parseCachedEmbedding(cached: string): number[] | null {
    try {
      const parsed = JSON.parse(cached);
      if (this.isValidEmbedding(parsed)) {
        return parsed;
      }

      this.logger.warn(
        `Ignoring cached AI search embedding with dimension ${Array.isArray(parsed) ? parsed.length : 'invalid'}; expected ${this.EMBEDDING_DIMENSION}.`,
      );
      return null;
    } catch {
      this.logger.warn('Ignoring malformed cached AI search embedding.');
      return null;
    }
  }

  private isValidEmbedding(embedding: unknown): embedding is number[] {
    return Array.isArray(embedding)
      && embedding.length === this.EMBEDDING_DIMENSION
      && embedding.every((value) => typeof value === 'number' && Number.isFinite(value));
  }

  private assertEmbeddingDimension(embedding: number[], source: string) {
    const dimension = embedding.length;
    if (!this.isValidEmbedding(embedding)) {
      throw new BadRequestException(
        `Invalid ${source} embedding dimension: got ${dimension}, expected ${this.EMBEDDING_DIMENSION}.`,
      );
    }
  }

  private async hydrateVectorResults(results: VectorSearchResult[]): Promise<AiSearchResult[]> {
    if (results.length === 0) {
      return [];
    }

    const similarityByArtworkId = new Map(
      results.map(result => [result.artwork_id, result.similarity]),
    );

    const artworks = await this.prisma.artwork.findMany({
      where: {
        id: { in: results.map(result => result.artwork_id) },
        status: 'PUBLISHED',
      },
      include: {
        author: true,
        images: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true }, orderBy: { order: 'asc' } },
      },
    });

    const artworkById = new Map(artworks.map(artwork => [artwork.id, artwork]));

    return results
      .map((result): AiSearchResult | null => {
        const artwork = artworkById.get(result.artwork_id);
        if (!artwork) {
          return null;
        }

        const primaryImage = artwork.images[0];

        return {
          id: artwork.id,
          title: artwork.title,
          description: artwork.description || '',
          slug: artwork.id,
          author: {
            id: artwork.author.id,
            username: artwork.author.username || '',
            displayName: artwork.author.displayName || '',
            avatar: artwork.author.avatar || '',
          },
          thumbnail: primaryImage?.thumbnailUrl || primaryImage?.url || '',
          tags: artwork.tags.map(artworkTag => artworkTag.tag.name),
          rating: artwork.rating,
          isAI: artwork.isAI,
          createdAt: Math.floor(artwork.createdAt.getTime() / 1000),
          likeCount: artwork.likeCount,
          viewCount: artwork.viewCount,
          ratioClass: artwork.ratioClass || 'square',
          maxResolution: artwork.maxResolution || 0,
          isHighRes: artwork.isHighRes,
          similarity: similarityByArtworkId.get(artwork.id) || 0,
        };
      })
      .filter((artwork): artwork is AiSearchResult => artwork !== null);
  }

  private async getSettings() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'discover_settings' },
    });
    return setting?.value as any || {
      freeTextSearchLimit: 10,
      freeSketchSearchLimit: 2,
    };
  }

  private async checkRateLimit(userId: string | undefined, ip: string | undefined | null, type: 'text' | 'sketch') {
    // If logged in, check subscription
    if (userId) {
      const subscription = await this.prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
      });
      // Premium user has no limits
      if (subscription) return;
    }

    const settings = await this.getSettings();
    // AAAAAAAAAAAAAA thay đổi ở production
    // const limit = type === 'text' ? settings.freeTextSearchLimit : settings.freeSketchSearchLimit;
    const limit = 9999;
    // AAAAAAAAAAA thay đổi ở production
    
    const today = new Date().toISOString().slice(0, 10);
    const key = `rate_limit:ai_search:${type}:${today}:${userId || ip || 'unknown'}`;
    const countStr = await this.redis.get(key);
    const count = countStr ? parseInt(countStr, 10) : 0;

    if (count >= limit) {
      throw new ForbiddenException(`Free ${type} search limit reached (${limit}/day). Upgrade to Premium for unlimited searches.`);
    }
  }

  private async incrementUsage(userId: string | undefined, ip: string | undefined | null, type: 'text' | 'sketch') {
    if (userId) {
      const subscription = await this.prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
      });
      if (subscription) return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const key = `rate_limit:ai_search:${type}:${today}:${userId || ip || 'unknown'}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 86400); // 1 day
  }
}
