/**
 * Prisma Service
 * Manages database connection lifecycle
 * Reference: https://docs.nestjs.com/recipes/prisma
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  /**
   * Connect to database when module initializes
   */
  async onModuleInit() {
    await this.$connect();
    console.log('[PrismaService] Connected to database');
  }

  /**
   * Disconnect from database when module destroys
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('[PrismaService] Disconnected from database');
  }

  /**
   * Clean database (for testing)
   * WARNING: Deletes all data!
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    await this.$transaction([
      // Layer 1: Leaf tables
      this.invoice.deleteMany(),
      this.payment.deleteMany(),
      this.tierContent.deleteMany(),
      this.tierSubscription.deleteMany(),
      this.payout.deleteMany(),
      this.userInteraction.deleteMany(),
      this.notification.deleteMany(),
      this.userWarning.deleteMany(),
      this.auditLog.deleteMany(),
      this.announcement.deleteMany(),
      this.systemSetting.deleteMany(),
      this.report.deleteMany(),
      this.bookmark.deleteMany(),
      this.collection.deleteMany(),
      this.follow.deleteMany(),
      this.like.deleteMany(),
      this.comment.deleteMany(),
      this.artworkTag.deleteMany(),
      this.artworkImage.deleteMany(),
      
      // Layer 2: Parent tables
      this.artistTier.deleteMany(),
      this.subscription.deleteMany(),
      this.plan.deleteMany(),
      this.artwork.deleteMany(),
      this.tag.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}
