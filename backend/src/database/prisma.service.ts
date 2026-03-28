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

    // Delete in order to respect foreign key constraints
    await this.bookmark.deleteMany();
    await this.collection.deleteMany();
    await this.follow.deleteMany();
    await this.like.deleteMany();
    await this.comment.deleteMany();
    await this.artworkTag.deleteMany();
    await this.artworkImage.deleteMany();
    await this.artwork.deleteMany();
    await this.tag.deleteMany();
    await this.user.deleteMany();
  }
}
