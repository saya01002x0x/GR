/**
 * Users Service
 * Handle user operations including Lazy Sync with Clerk
 * Reference: https://docs.nestjs.com/providers
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ArtworkVisibility, User } from '@prisma/client';

export interface ClerkUserData {
  clerkId: string;
  email: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly artworkSummaryInclude = {
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

  /**
   * Find or Create user by Clerk ID (Lazy Sync)
   * ﾄ脆ｰ盻｣c g盻絞 m盻擁 khi user authenticate thﾃnh cﾃｴng
   * @param clerkData - Data t盻ｫ Clerk API
   * @returns User record t盻ｫ database
   */
  async findOrCreateByClerkId(clerkData: ClerkUserData): Promise<User> {
    const { clerkId, email, username, displayName, avatar } = clerkData;

    return this.prisma.user.upsert({
      where: { clerkId },
      update: {
        // Update cﾃ｡c field cﾃｳ th盻・thay ﾄ黛ｻ品
        displayName: displayName || undefined,
        avatar: avatar || undefined,
      },
      create: {
        clerkId,
        email,
        username,
        displayName,
        avatar,
      },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by Clerk ID
   */
  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { clerkId },
    });
  }

  /**
   * Become an Artist
   * Update isArtist flag to true
   */
  async becomeArtist(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isArtist: true },
    });
  }

  /**
   * Get list of artists with their artwork count
   */
  async findArtists(limit = 10) {
    return this.prisma.user.findMany({
      where: { isArtist: true },
      include: {
        _count: {
          select: { artworks: true },
        },
      },
      take: limit,
    });
  }

  async findPublicArtistDetail(identifier: string, viewerId?: string | null) {
    const artist = await this.prisma.user.findFirst({
      where: { 
        OR: [{ id: identifier }, { username: identifier }],
        isArtist: true 
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        banner: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            artworks: true,
            followers: true,
          },
        },
      },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    const activeTiers = await this.prisma.artistTier.findMany({
      where: { artistId: artist.id, isActive: true },
      orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    const activeSubscriptions = viewerId
      ? await this.prisma.tierSubscription.findMany({
          where: {
            subscriberId: viewerId,
            artistId: artist.id,
            status: 'ACTIVE',
          },
          select: { tierId: true },
        })
      : [];

    const accessibleTierIds = new Set(activeSubscriptions.map(subscription => subscription.tierId));
    const isOwner = viewerId === artist.id;

    const counts = await Promise.all([
      this.prisma.artwork.count({
        where: {
          authorId: artist.id,
          status: 'PUBLISHED',
          OR: isOwner
            ? undefined
            : [
                { visibility: ArtworkVisibility.PUBLIC },
                ...(accessibleTierIds.size > 0
                  ? [{ requiredTierId: { in: Array.from(accessibleTierIds) } }]
                  : []),
              ],
        },
      }),
      this.prisma.artwork.count({
        where: {
          authorId: artist.id,
          status: 'PUBLISHED',
          visibility: ArtworkVisibility.PUBLIC,
        },
      }),
      ...activeTiers.map(tier =>
        this.prisma.artwork.count({
          where: {
            authorId: artist.id,
            status: 'PUBLISHED',
            requiredTierId: tier.id,
            ...(isOwner ? {} : accessibleTierIds.has(tier.id) ? {} : { id: { equals: '__hidden__' } }),
          },
        }),
      ),
    ]);

    return {
      ...artist,
      isOwner,
      tiers: activeTiers.map(tier => ({
        ...tier,
        memberCount: tier._count.subscriptions,
      })),
      accessibleTierIds: Array.from(accessibleTierIds),
      artworkCounts: {
        all: counts[0],
        free: counts[1],
        tiers: activeTiers.reduce<Record<string, number>>((acc, tier, index) => {
          acc[tier.id] = counts[index + 2];
          return acc;
        }, {}),
      },
    };
  }

  async findArtistArtworks(
    identifier: string,
    filter: { visibility?: 'all' | 'free' | 'premium'; tierId?: string | null; limit?: number; offset?: number },
    viewerId?: string | null,
  ) {
    const artist = await this.prisma.user.findFirst({
      where: { 
        OR: [{ id: identifier }, { username: identifier }],
        isArtist: true 
      },
      select: { id: true },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    const isOwner = viewerId === artist.id;
    const activeSubscriptions = !isOwner && viewerId
      ? await this.prisma.tierSubscription.findMany({
          where: {
            subscriberId: viewerId,
            artistId: artist.id,
            status: 'ACTIVE',
          },
          select: { tierId: true },
        })
      : [];

    const accessibleTierIds = activeSubscriptions.map(subscription => subscription.tierId);
    const accessWhere = isOwner
      ? {}
      : {
          OR: [
            { visibility: ArtworkVisibility.PUBLIC },
            ...(accessibleTierIds.length > 0 ? [{ requiredTierId: { in: accessibleTierIds } }] : []),
          ],
        };

    const visibilityWhere = filter.tierId
      ? { requiredTierId: filter.tierId }
      : filter.visibility === 'free'
        ? { visibility: ArtworkVisibility.PUBLIC }
        : filter.visibility === 'premium'
          ? { visibility: ArtworkVisibility.TIER_GATED }
          : {};

    const where = {
      authorId: artist.id,
      status: 'PUBLISHED' as const,
      ...accessWhere,
      ...visibilityWhere,
    };

    const limit = filter.limit ?? 24;
    const offset = filter.offset ?? 0;

    const [artworks, total] = await Promise.all([
      this.prisma.artwork.findMany({
        where,
        include: this.artworkSummaryInclude,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.artwork.count({ where }),
    ]);

    return {
      artworks,
      total,
      hasMore: offset + artworks.length < total,
    };
  }

  /**
   * Get tier preview data for the Membership tab
   * Returns all tiers with blurred artwork previews for non-subscribers
   */
  async findArtistTierPreviews(identifier: string, viewerId?: string | null) {
    const artist = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: identifier }, { username: identifier }],
        isArtist: true,
      },
      select: { id: true },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    // Get all active tiers
    const tiers = await this.prisma.artistTier.findMany({
      where: { artistId: artist.id, isActive: true },
      orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
    });

    // Get viewer's subscribed tier IDs
    const subscribedTierIds = viewerId
      ? (await this.prisma.tierSubscription.findMany({
          where: { subscriberId: viewerId, artistId: artist.id, status: 'ACTIVE' },
          select: { tierId: true },
        })).map(s => s.tierId)
      : [];

    // For each tier, get preview artworks and counts
    const result = await Promise.all(tiers.map(async (tier) => {
      const isSubscribed = subscribedTierIds.includes(tier.id);

      const totalArtworks = await this.prisma.artwork.count({
        where: { requiredTierId: tier.id, status: 'PUBLISHED' },
      });

      // Only get blurred previews for unsubscribed tiers
      const previewArtworks = !isSubscribed
        ? await this.prisma.artwork.findMany({
            where: { requiredTierId: tier.id, status: 'PUBLISHED' },
            take: 6,
            orderBy: { createdAt: 'desc' },
            include: {
              images: {
                take: 1,
                orderBy: { order: 'asc' },
                select: { blurredUrl: true, thumbnailUrl: true, aspectRatio: true },
              },
            },
          })
        : [];

      const memberCount = await this.prisma.tierSubscription.count({
        where: { tierId: tier.id, status: 'ACTIVE' },
      });

      return {
        tier: {
          id: tier.id,
          name: tier.name,
          description: tier.description,
          price: tier.price,
          currency: tier.currency,
          benefits: tier.benefits,
          memberCount,
        },
        isSubscribed,
        totalArtworks,
        previewArtworks: previewArtworks.map(a => ({
          id: a.id,
          blurredUrl: a.images[0]?.blurredUrl || a.images[0]?.thumbnailUrl || null,
          aspectRatio: a.images[0]?.aspectRatio || 1,
        })),
      };
    }));

    return result;
  }
}
