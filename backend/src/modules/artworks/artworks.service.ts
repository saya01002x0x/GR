/**
 * Artworks Service
 * Handle artwork CRUD operations with image processing
 * Reference: https://docs.nestjs.com/providers
 */

import { Injectable, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Artwork, ArtworkVisibility, ContentRating, ArtworkStatus } from '@prisma/client';
import { StripeService } from '../payments/stripe.service';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAME, JOB_PROCESS_IMAGES } from '../queue/queue.constants';
import { randomUUID } from 'crypto';

export interface CreateArtworkDto {
  title: string;
  description?: string;
  tags: string[]; // Normalized: lowercase, trimmed
  rating: ContentRating;
  isAI: boolean;
  visibility: ArtworkVisibility;
  requiredTierId?: string;
}

export interface CreateArtworkResult {
  artwork: Artwork;
  images: {
    original: string;
    preview: string;
    thumbnail: string;
  };
}

type ArtworkAccessSubject = {
  authorId: string;
  visibility: ArtworkVisibility;
  requiredTierId: string | null;
};

type ArtworkAccessState = {
  isOwner: boolean;
  isSubscribed: boolean;
  canViewFull: boolean;
};

@Injectable()
export class ArtworksService {
  private readonly logger = new Logger(ArtworksService.name);
  private readonly artworkDetailInclude = {
    author: {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
      },
    },
    images: true,
    tags: {
      include: { tag: true },
    },
    requiredTier: {
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
      },
    },
  };

  private readonly artworkListInclude = {
    author: {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
      },
    },
    images: {
      take: 1,
      orderBy: { order: 'asc' as const },
    },
    requiredTier: {
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
      },
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    @InjectQueue(QUEUE_NAME) private readonly queue: Queue,
  ) {}

  /**
   * Create artwork with multiple images
   * Images are matched with metadata by INDEX (not originalName)
   * Transaction-safe: DRAFT -> Upload -> PUBLISHED
   */
  async create(
    dto: CreateArtworkDto,
    files: Express.Multer.File[],
    metadata: {
      order: number;
      caption?: string;
      watermark?: {
        enabled: boolean;
        position: string;
        opacity: number;
        size: number;
      };
    }[],
    userId: string,
    isArtist: boolean,
  ): Promise<{ message: string; artwork: Artwork; jobId: string }> {
    // Only artists can upload
    if (!isArtist) {
      throw new ForbiddenException('Only artists can upload artworks');
    }

    // Validate at least 1 tag
    if (!dto.tags || dto.tags.length === 0) {
      throw new ForbiddenException('At least 1 tag is required');
    }

    // Validate file
    if (!files || files.length === 0) {
      throw new ForbiddenException('At least 1 image is required');
    }

    let requiredTierId: string | null = null;
    if (dto.visibility === ArtworkVisibility.TIER_GATED) {
      if (!dto.requiredTierId) {
        throw new ForbiddenException('Tier-gated artwork must have a required tier');
      }

      const tier = await this.prisma.artistTier.findUnique({ where: { id: dto.requiredTierId } });
      if (!tier || !tier.isActive || tier.artistId !== userId) {
        throw new ForbiddenException('Invalid tier selected for gated artwork');
      }

      requiredTierId = tier.id;
    }

    // Step 1: Create artwork with PROCESSING status
    const artwork = await this.prisma.artwork.create({
      data: {
        title: dto.title,
        description: dto.description,
        rating: dto.rating,
        isAI: dto.isAI,
        visibility: dto.visibility,
        requiredTierId,
        status: 'PROCESSING' as ArtworkStatus,
        authorId: userId,
      },
    });

    this.logger.log(
      `Created artwork ${artwork.id} (PROCESSING). Uploading ${files.length} raw files...`,
    );

    try {
      // Step 2: Upload RAW files to MinIO
      const rawFiles = await Promise.all(
        files.map(async (file, index) => {
          const uniqueId = randomUUID();
          const ext = file.originalname.split('.').pop() || 'jpg';
          const key = `raw/artworks/${artwork.id}/${uniqueId}_${index}.${ext}`;

          await this.storageService.uploadRaw(file.buffer, key);

          return {
            key,
            originalName: file.originalname,
            mimeType: file.mimetype,
            order: metadata[index]?.order ?? index,
            caption: metadata[index]?.caption || null,
            watermark: metadata[index]?.watermark || null,
          };
        }),
      );

      // Step 3: Add Job to Queue
      const queueJob = await this.queue.add(
        JOB_PROCESS_IMAGES,
        {
          artworkId: artwork.id,
          userId,
          files: rawFiles,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: { age: 300 }, // Keep completed jobs for 5 min (SSE needs to read final state)
          removeOnFail: { age: 3600 },    // Keep failed jobs for 1 hour
        },
      );

      this.logger.log(`Added job ${queueJob.id} for artwork ${artwork.id} to queue`);

      // Step 4: Step 3 (Create Tags) moved to here to ensure tags exist
      // Or worker can do it. But doing it here gives immediate feedback on tags.
      // Actually worker does it in transaction. Let's do tags here to link Relation later?
      // Plan said Worker does it. Let's stick to plan: "Transaction: Create DB Records" in Worker.
      // But we need Tags to exist? Worker can upsert tags.

      // HOWEVER: logic in worker needs DTO tags.
      // Wait, I forgot to pass DTO tags to Worker!
      // The plan said: "Transaction: Create DB Records (ArtworkImage)".
      // What about Tags?
      // The worker needs to know the tags to create ArtworkTag relations.
      // I should update the Job payload to include tags.

      // Let's create tags here (synchronously) because it's fast and metadata.
      await Promise.all(
        dto.tags.map((tagName) =>
          this.prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          }),
        ),
      );

      // We also need to link tags to artwork?
      // If we link them now, they exist.
      // Let's link them now! It's metadata, fast operation.
      // Then worker only deals with IMAGES.
      const tags = await this.prisma.tag.findMany({
        where: { name: { in: dto.tags } },
      });

      await this.prisma.artworkTag.createMany({
        data: tags.map((tag, index) => ({
          artworkId: artwork.id,
          tagId: tag.id,
          order: index,
        })),
      });

      return {
        message: 'Upload successful. Processing in background.',
        artwork: { ...artwork, status: 'PROCESSING' as ArtworkStatus },
        jobId: String(queueJob.id),
      };
    } catch (error) {
      this.logger.error(
        `Failed to initiate upload for artwork ${artwork.id}`,
        error,
      );

      // Cleanup: Delete artwork record if initial upload fails
      await this.prisma.artwork
        .delete({ where: { id: artwork.id } })
        .catch(() => {});

      throw error;
    }
  }

  /**
   * Get artwork by ID with author and images
   */
  async findById(id: string, viewerId?: string | null) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id },
      include: this.artworkDetailInclude,
    });

    if (!artwork) {
      return null;
    }

    if (artwork.status === ArtworkStatus.HIDDEN) {
      throw new NotFoundException('Artwork not found');
    }

    if (
      artwork.status !== ArtworkStatus.PUBLISHED
      && artwork.authorId !== viewerId
    ) {
      throw new NotFoundException('Artwork not found');
    }

    const access = await this.getArtworkAccess(this.toArtworkAccessSubject(artwork), viewerId);
    if (!access.canViewFull) {
      throw new NotFoundException('Artwork not found');
    }

    return {
      ...artwork,
      access,
    };
  }

  /**
   * Get all published artworks with pagination
   * Default: 25 items per page
   */
  async findAll(options: { limit?: number; offset?: number; viewerId?: string | null } = {}) {
    const { limit = 25, offset = 0, viewerId } = options;

    const accessibleTierIds = viewerId
      ? (await this.prisma.tierSubscription.findMany({
          where: { subscriberId: viewerId, status: 'ACTIVE' },
          select: { tierId: true },
        })).map(subscription => subscription.tierId)
      : [];

    const [artworks, total] = await Promise.all([
      this.prisma.artwork.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { visibility: ArtworkVisibility.PUBLIC },
            ...(viewerId ? [{ authorId: viewerId }] : []),
            ...(accessibleTierIds.length > 0 ? [{ requiredTierId: { in: accessibleTierIds } }] : []),
          ],
        },
        include: this.artworkListInclude,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.artwork.count({
        where: {
          status: 'PUBLISHED',
          OR: [
            { visibility: ArtworkVisibility.PUBLIC },
            ...(viewerId ? [{ authorId: viewerId }] : []),
            ...(accessibleTierIds.length > 0 ? [{ requiredTierId: { in: accessibleTierIds } }] : []),
          ],
        },
      }),
    ]);

    const accessibleTierIdSet = new Set(accessibleTierIds);

    return {
      artworks: artworks.map(artwork => ({
        ...artwork,
        access: this.getArtworkAccessFromAccessibleTierIds(artwork, accessibleTierIdSet, viewerId),
      })),
      total,
      hasMore: offset + artworks.length < total,
    };
  }

  /**
   * Get related artworks by tags (OR logic)
   * Fallback: same author or latest artworks
   */
  async findRelated(artworkId: string, limit = 10, viewerId?: string | null) {
    // Get current artwork with tags
    const artwork = await this.prisma.artwork.findUnique({
      where: { id: artworkId },
      include: {
        tags: { include: { tag: true } },
      },
    });

    if (!artwork) {
      return [];
    }

    const tagNames = artwork.tags.map((t) => t.tag.name);

    // Try to find by matching tags (OR logic)
    const matchingArtworks = await this.prisma.artwork.findMany({
      where: {
        id: { not: artworkId },
        status: 'PUBLISHED',
        tags: {
          some: {
            tag: {
              name: { in: tagNames },
            },
          },
        },
      },
      include: this.artworkListInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    let relatedArtworks = await this.filterAccessibleArtworks(matchingArtworks, viewerId);

    // Fallback: same author or latest
    if (relatedArtworks.length < limit) {
      const remaining = limit - relatedArtworks.length;
      const existingIds = [artworkId, ...relatedArtworks.map((a) => String(a.id))];

      const fallbackArtworks = await this.prisma.artwork.findMany({
        where: {
          id: { notIn: existingIds },
          status: 'PUBLISHED',
          OR: [
            { authorId: artwork.authorId },
            {}, // Any artwork as last resort
          ],
        },
        include: this.artworkListInclude,
        orderBy: { createdAt: 'desc' },
        take: remaining,
      });

      const accessibleFallbackArtworks = await this.filterAccessibleArtworks(fallbackArtworks, viewerId);
      relatedArtworks = [...relatedArtworks, ...accessibleFallbackArtworks].slice(0, limit);
    }

    return relatedArtworks;
  }

  /**
   * Get artworks by user ID
   */
  async findByUserId(userId: string) {
    return this.prisma.artwork.findMany({
      where: {
        authorId: userId,
        status: { not: ArtworkStatus.HIDDEN },
      },
      include: {
        images: {
          take: 1,
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get trending artworks (by viewCount)
   */
  async findTrending(limit = 10) {
    return this.prisma.artwork.findMany({
      where: { status: 'PUBLISHED', visibility: ArtworkVisibility.PUBLIC },
      include: this.artworkListInclude,
      orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  // ==================== DISCOVER ====================

  async getHeroArtworks() {
    // For now, get 3 most liked/viewed artworks with different tags if possible
    // Or just top 3 recent popular artworks
    const artworks = await this.prisma.artwork.findMany({
      where: { status: 'PUBLISHED', visibility: ArtworkVisibility.PUBLIC },
      include: this.artworkListInclude,
      orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
      take: 3,
    });

    // Format them to match FeaturedItem frontend type
    return artworks.map((artwork, i) => ({
      id: artwork.id,
      title: artwork.title,
      subtitle: artwork.description?.slice(0, 100) || 'Featured artwork',
      image: artwork.images[0]?.url || '',
      tag: { 
        label: i === 0 ? 'Spotlight' : (i === 1 ? 'Staff Pick' : 'Tutorial'), 
        color: i === 0 ? 'primary' : (i === 1 ? 'primary' : 'blue') 
      },
      artwork, // send full data just in case
    }));
  }

  async getFeaturedArtworks() {
    const now = new Date();
    return this.prisma.artwork.findMany({
      where: {
        status: 'PUBLISHED',
        isPromoted: true,
        promotedUntil: { gt: now },
        visibility: ArtworkVisibility.PUBLIC,
      },
      include: this.artworkDetailInclude, // Includes full author details
      orderBy: { promotedAt: 'desc' },
      take: 5,
    });
  }

  async getRanking(timeframe: string) {
    const now = new Date();
    let startDate = new Date();
    
    if (timeframe === 'daily') {
      startDate.setDate(now.getDate() - 1);
    } else if (timeframe === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'monthly') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeframe === 'rookie') {
      // Rookie: Artwork from artists who joined recently
      const settings = await this.prisma.systemSetting.findUnique({
        where: { key: 'discover_settings' },
      });
      const rookieDays = (settings?.value as any)?.rookieAccountAgeDays || 90;
      const rookieCutoff = new Date();
      rookieCutoff.setDate(now.getDate() - rookieDays);
      
      return this.prisma.artwork.findMany({
        where: {
          status: 'PUBLISHED',
          visibility: ArtworkVisibility.PUBLIC,
          author: {
            createdAt: { gt: rookieCutoff }
          }
        },
        include: this.artworkListInclude,
        orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
        take: 20,
      });
    }

    // For daily/weekly/monthly, we should ideally sum up views/likes within the period.
    // Since we don't have time-series interaction data aggregated yet, we will sort by recent artworks + their total engagement as an approximation.
    return this.prisma.artwork.findMany({
      where: {
        status: 'PUBLISHED',
        visibility: ArtworkVisibility.PUBLIC,
        createdAt: { gt: startDate },
      },
      include: this.artworkListInclude,
      orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
      take: 20,
    });
  }

  async getRisingStars() {
    const settings = await this.prisma.systemSetting.findUnique({
      where: { key: 'discover_settings' },
    });
    const days = (settings?.value as any)?.risingStarsAccountAgeDays || 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const users = await this.prisma.user.findMany({
      where: {
        isArtist: true,
        createdAt: { gt: cutoff },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        _count: {
          select: { followers: true }
        }
      },
      orderBy: {
        followers: {
          _count: 'desc'
        }
      },
      take: 5,
    });

    return users.map(u => ({
      id: u.id,
      name: u.displayName || u.username,
      avatar: u.avatar || '',
      followers: u._count.followers,
    }));
  }

  async getPopularTags(limit = 10) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tags = await this.prisma.artworkTag.groupBy({
      by: ['tagId'],
      where: {
        artwork: { createdAt: { gte: thirtyDaysAgo }, status: 'PUBLISHED' },
      },
      _count: { tagId: true },
      orderBy: { _count: { tagId: 'desc' } },
      take: limit,
    });

    const tagIds = tags.map((t) => t.tagId);
    const tagRecords = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
    });
    const tagMap = new Map(tagRecords.map((t) => [t.id, t.name]));

    return tags.map((t) => tagMap.get(t.tagId)).filter(Boolean);
  }

  // ====================================================

  /**
   * Promote artwork
   */
  async promoteArtwork(artworkId: string, userId: string, weeks: number) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id: artworkId },
      include: { author: true }
    });

    if (!artwork || artwork.authorId !== userId) {
      throw new ForbiddenException('Not authorized to promote this artwork');
    }

    const settings = await this.prisma.systemSetting.findUnique({
      where: { key: 'discover_settings' },
    });
    const config = settings?.value as any || { promotionPricePerWeek: 5.0 };
    
    const price = config.promotionPricePerWeek * weeks;
    this.logger.log(`Creating Stripe checkout to promote artwork ${artworkId} for ${weeks} weeks. Total: $${price}`);

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5146';
    
    return this.stripeService.createOneTimeCheckoutSession({
      productName: `Promote Artwork: ${artwork.title}`,
      amount: price,
      currency: 'usd',
      successUrl: `${frontendUrl}/discover?promotion=success`,
      cancelUrl: `${frontendUrl}/discover?promotion=cancelled`,
      userEmail: artwork.author.email || undefined,
      metadata: {
        type: 'PROMOTE_ARTWORK',
        artworkId,
        userId,
        weeks: weeks.toString()
      }
    });
  }



  private async filterAccessibleArtworks(
    artworks: Array<Record<string, unknown>>,
    viewerId?: string | null,
  ): Promise<Array<Record<string, unknown> & { access: ArtworkAccessState }>> {
    const accessibleTierIds = viewerId
      ? new Set((await this.prisma.tierSubscription.findMany({
          where: { subscriberId: viewerId, status: 'ACTIVE' },
          select: { tierId: true },
        })).map(subscription => subscription.tierId))
      : new Set<string>();

    const filtered = artworks.map(artwork => {
      const access = this.getArtworkAccessFromAccessibleTierIds(artwork, accessibleTierIds, viewerId);
      return access.canViewFull ? { ...artwork, access } : null;
    });

    return filtered.filter(Boolean) as Array<Record<string, unknown> & { access: ArtworkAccessState }>;
  }

  private getArtworkAccessFromAccessibleTierIds(
    artwork: Record<string, unknown>,
    accessibleTierIds: Set<string>,
    viewerId?: string | null,
  ): ArtworkAccessState {
    const subject = this.toArtworkAccessSubject(artwork);
    const isOwner = Boolean(viewerId && subject.authorId === viewerId);

    if (subject.visibility === ArtworkVisibility.PUBLIC || isOwner) {
      return {
        isOwner,
        isSubscribed: false,
        canViewFull: true,
      };
    }

    if (!viewerId || !subject.requiredTierId) {
      return {
        isOwner,
        isSubscribed: false,
        canViewFull: false,
      };
    }

    const isSubscribed = accessibleTierIds.has(subject.requiredTierId);
    return {
      isOwner,
      isSubscribed,
      canViewFull: isSubscribed,
    };
  }

  private toArtworkAccessSubject(artwork: Record<string, unknown>): ArtworkAccessSubject {
    const requiredTier = artwork.requiredTier as { id?: unknown } | null | undefined;
    const tier = artwork.tier as { id?: unknown } | null | undefined;
    const requiredTierId = artwork.requiredTierId
      ?? artwork.tierId
      ?? requiredTier?.id
      ?? tier?.id
      ?? null;

    return {
      authorId: String(artwork.authorId || ''),
      visibility: artwork.visibility as ArtworkVisibility,
      requiredTierId: requiredTierId === null ? null : String(requiredTierId),
    };
  }

  private async getArtworkAccess(
    artwork: ArtworkAccessSubject,
    viewerId?: string | null,
  ): Promise<ArtworkAccessState> {
    const isOwner = Boolean(viewerId && artwork.authorId === viewerId);
    if (artwork.visibility === ArtworkVisibility.PUBLIC || isOwner) {
      return {
        isOwner,
        isSubscribed: false,
        canViewFull: true,
      };
    }

    if (!viewerId || !artwork.requiredTierId) {
      return {
        isOwner,
        isSubscribed: false,
        canViewFull: false,
      };
    }

    const subscription = await this.prisma.tierSubscription.findFirst({
      where: {
        subscriberId: viewerId,
        tierId: artwork.requiredTierId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    return {
      isOwner,
      isSubscribed: Boolean(subscription),
      canViewFull: Boolean(subscription),
    };
  }
}
