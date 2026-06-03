/**
 * Recommendations Service
 * Item-based Collaborative Filtering using PostgreSQL
 * Algorithm: "Users who interacted with artwork A also liked artwork B"
 * Results are cached in Redis for performance
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { REDIS_CLIENT } from '../../database/redis.constants';
import Redis from 'ioredis';

export interface RecommendationResult {
  artwork_id: string;
  match_score: number;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  /** Cache TTL: 1 hour */
  private readonly CACHE_TTL = 3600;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Get recommended artworks for a given artwork
   * Uses Item-based Collaborative Filtering:
   * 1. Find users who interacted with the current artwork
   * 2. Find other artworks those users also interacted with
   * 3. Rank by weighted interaction score
   *
   * Results are cached in Redis for 1 hour
   */
  async getRecommendations(
    artworkId: string,
    limit = 10,
  ): Promise<RecommendationResult[]> {
    // 1. Check Redis cache
    const cacheKey = `recommend:artwork:${artworkId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      this.logger.debug(`Cache HIT for recommendations: ${artworkId}`);
      return JSON.parse(cached);
    }

    // 2. Run collaborative filtering query
    this.logger.debug(`Cache MISS. Computing recommendations for: ${artworkId}`);

    const results = await this.prisma.$queryRaw<RecommendationResult[]>`
      WITH similar_users AS (
        SELECT DISTINCT user_id
        FROM user_interactions
        WHERE artwork_id = ${artworkId}
      )
      SELECT
        ui.artwork_id,
        SUM(ui.weight)::int AS match_score
      FROM user_interactions ui
      INNER JOIN similar_users su ON ui.user_id = su.user_id
      WHERE ui.artwork_id != ${artworkId}
      GROUP BY ui.artwork_id
      ORDER BY match_score DESC
      LIMIT ${limit}
    `;

    // 3. Cache results
    if (results.length > 0) {
      await this.redis.set(
        cacheKey,
        JSON.stringify(results),
        'EX',
        this.CACHE_TTL,
      );
    }

    return results;
  }

  /**
   * Get personalized recommendations for a user
   * Based on artworks the user has interacted with most
   * Algorithm: Find top interacted artworks -> get recommendations for each -> merge & deduplicate
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit = 20,
  ): Promise<RecommendationResult[]> {
    const cacheKey = `recommend:user:${userId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      this.logger.debug(`Cache HIT for user recommendations: ${userId}`);
      return JSON.parse(cached);
    }

    // Get artworks the user has NOT interacted with, but similar users have
    const results = await this.prisma.$queryRaw<RecommendationResult[]>`
      WITH user_artworks AS (
        SELECT DISTINCT artwork_id
        FROM user_interactions
        WHERE user_id = ${userId}
      ),
      similar_users AS (
        SELECT ui2.user_id, SUM(ui2.weight)::int AS affinity
        FROM user_interactions ui1
        INNER JOIN user_interactions ui2
          ON ui1.artwork_id = ui2.artwork_id
          AND ui1.user_id != ui2.user_id
        WHERE ui1.user_id = ${userId}
        GROUP BY ui2.user_id
        ORDER BY affinity DESC
        LIMIT 50
      )
      SELECT
        ui.artwork_id,
        SUM(ui.weight * su.affinity)::int AS match_score
      FROM user_interactions ui
      INNER JOIN similar_users su ON ui.user_id = su.user_id
      WHERE ui.artwork_id NOT IN (SELECT artwork_id FROM user_artworks)
      GROUP BY ui.artwork_id
      ORDER BY match_score DESC
      LIMIT ${limit}
    `;

    if (results.length > 0) {
      await this.redis.set(
        cacheKey,
        JSON.stringify(results),
        'EX',
        this.CACHE_TTL,
      );
    }

    return results;
  }

  /**
   * Invalidate cache when new interactions are recorded
   * Called after significant user actions (like, unlock)
   */
  async invalidateCache(artworkId: string): Promise<void> {
    const cacheKey = `recommend:artwork:${artworkId}`;
    await this.redis.del(cacheKey);
    this.logger.debug(`Invalidated recommendation cache for: ${artworkId}`);
  }
}
