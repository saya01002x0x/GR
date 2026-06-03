/**
 * Interactions Service
 * Tracks user interactions (view, like, comment, unlock) with artworks
 * Data feeds into the collaborative filtering recommendation engine
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { REDIS_CLIENT } from '../../database/redis.constants';
import Redis from 'ioredis';
import { InteractionType } from '@prisma/client';

/** Weight values for each interaction type */
const INTERACTION_WEIGHTS: Record<InteractionType, number> = {
  VIEW: 1,
  LIKE: 3,
  COMMENT: 2,
  UNLOCK: 5,
};

@Injectable()
export class InteractionsService {
  private readonly logger = new Logger(InteractionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Record a user interaction with an artwork
   * Uses upsert to update weight if interaction already exists
   * Also debounces VIEW events using Redis (1 view per user per artwork per hour)
   */
  async trackInteraction(
    userId: string,
    artworkId: string,
    action: InteractionType,
  ): Promise<void> {
    const weight = INTERACTION_WEIGHTS[action];

    // Debounce VIEW events: max 1 per hour per user-artwork pair
    if (action === InteractionType.VIEW) {
      const debounceKey = `interaction:view:${userId}:${artworkId}`;
      const exists = await this.redis.get(debounceKey);
      if (exists) {
        return; // Skip duplicate view within the hour
      }
      // Set debounce key with 1 hour TTL
      await this.redis.set(debounceKey, '1', 'EX', 3600);
    }

    try {
      await this.prisma.userInteraction.upsert({
        where: {
          userId_artworkId_action: {
            userId,
            artworkId,
            action,
          },
        },
        update: {
          weight,
          createdAt: new Date(),
        },
        create: {
          userId,
          artworkId,
          action,
          weight,
        },
      });

      this.logger.debug(
        `Tracked ${action} (weight: ${weight}) for user ${userId} on artwork ${artworkId}`,
      );
    } catch (error) {
      // Don't throw - interaction tracking should never break the main flow
      this.logger.error(
        `Failed to track interaction: ${error.message}`,
      );
    }
  }
}
