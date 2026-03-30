/**
 * Reconciliation Task
 * Daily cron job at 3:00 AM to fix counter drift
 * - COUNT(*) actual likes/comments from relation tables
 * - Update artwork counters in Postgres
 * - Partial update Meilisearch for changed artworks
 * Reference: https://docs.nestjs.com/techniques/task-scheduling
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class ReconciliationTask {
  private readonly logger = new Logger(ReconciliationTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  /**
   * Scheduled reconciliation — runs every day at 3:00 AM
   * Fixes counter drift caused by async processing
   */
  @Cron('0 3 * * *')
  async handleReconciliation(): Promise<void> {
    this.logger.log('🔄 Starting daily counter reconciliation...');
    const startTime = Date.now();

    try {
      const batchSize = 100;
      let offset = 0;
      let totalFixed = 0;
      const meiliUpdates: Record<string, any>[] = [];

      // Process artworks in batches
      while (true) {
        const artworks = await this.prisma.artwork.findMany({
          where: { status: 'PUBLISHED' },
          select: {
            id: true,
            likeCount: true,
            commentCount: true,
            viewCount: true,
          },
          orderBy: { createdAt: 'asc' },
          take: batchSize,
          skip: offset,
        });

        if (artworks.length === 0) break;

        const artworkIds = artworks.map((a) => a.id);

        // Count actual likes per artwork
        const likeCounts = await this.prisma.like.groupBy({
          by: ['artworkId'],
          where: { artworkId: { in: artworkIds } },
          _count: { artworkId: true },
        });

        // Count actual comments per artwork
        const commentCounts = await this.prisma.comment.groupBy({
          by: ['artworkId'],
          where: { artworkId: { in: artworkIds } },
          _count: { artworkId: true },
        });

        // Build lookup maps
        const likeMap = new Map(
          likeCounts.map((lc) => [lc.artworkId, lc._count.artworkId]),
        );
        const commentMap = new Map(
          commentCounts.map((cc) => [cc.artworkId, cc._count.artworkId]),
        );

        // Compare and fix
        for (const artwork of artworks) {
          const actualLikes = likeMap.get(artwork.id) || 0;
          const actualComments = commentMap.get(artwork.id) || 0;

          const likesDiff = actualLikes !== artwork.likeCount;
          const commentsDiff = actualComments !== artwork.commentCount;

          if (likesDiff || commentsDiff) {
            await this.prisma.artwork.update({
              where: { id: artwork.id },
              data: {
                likeCount: actualLikes,
                commentCount: actualComments,
              },
            });

            meiliUpdates.push({
              id: artwork.id,
              likeCount: actualLikes,
              commentCount: actualComments,
              viewCount: artwork.viewCount, // Keep current view count
            });

            totalFixed++;

            if (likesDiff) {
              this.logger.debug(
                `Fixed likeCount for ${artwork.id}: ${artwork.likeCount} → ${actualLikes}`,
              );
            }
            if (commentsDiff) {
              this.logger.debug(
                `Fixed commentCount for ${artwork.id}: ${artwork.commentCount} → ${actualComments}`,
              );
            }
          }
        }

        offset += batchSize;
      }

      // Batch partial update Meilisearch for all fixed artworks
      if (meiliUpdates.length > 0) {
        try {
          await this.searchService.updatePartialDocuments(meiliUpdates);
          this.logger.log(
            `Updated ${meiliUpdates.length} documents in Meilisearch`,
          );
        } catch (meiliError) {
          this.logger.error(
            'Failed to sync reconciled data to Meilisearch',
            meiliError,
          );
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(
        `✅ Reconciliation complete: ${totalFixed} artworks fixed in ${duration}s`,
      );
    } catch (error) {
      this.logger.error('❌ Reconciliation failed', error);
    }
  }
}
