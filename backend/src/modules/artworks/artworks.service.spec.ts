import { NotFoundException } from '@nestjs/common';
import { ArtworkStatus, ArtworkVisibility } from '@prisma/client';
import { ArtworksService } from './artworks.service';

describe('ArtworksService', () => {
  const prisma = {
    artwork: {
      findUnique: jest.fn(),
    },
    tierSubscription: {
      findMany: jest.fn(),
    },
    artistTier: {
      findMany: jest.fn(),
    },
  };

  const service = new ArtworksService(
    prisma as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('throws NotFoundException for hidden artworks even when viewed by the owner', async () => {
      prisma.artwork.findUnique.mockResolvedValue({
        id: 'artwork-1',
        authorId: 'owner-1',
        status: ArtworkStatus.HIDDEN,
        visibility: ArtworkVisibility.PUBLIC,
        requiredTierId: null,
        author: {
          id: 'owner-1',
          username: 'owner',
          displayName: null,
          avatar: null,
        },
        images: [],
        tags: [],
        requiredTier: null,
      });

      await expect(service.findById('artwork-1', 'owner-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('allows a subscriber to view artwork from an included child tier', async () => {
      prisma.artwork.findUnique.mockResolvedValue({
        id: 'artwork-1',
        authorId: 'artist-1',
        status: ArtworkStatus.PUBLISHED,
        visibility: ArtworkVisibility.TIER_GATED,
        requiredTierId: 'tier-b',
        author: {
          id: 'artist-1',
          username: 'artist',
          displayName: null,
          avatar: null,
        },
        images: [{ id: 'image-1', url: 'https://example.com/tier-b.jpg' }],
        tags: [],
        requiredTier: {
          id: 'tier-b',
          name: 'Tier B',
          price: 10,
          currency: 'VND',
        },
      });
      prisma.tierSubscription.findMany.mockResolvedValue([{ tierId: 'tier-a' }]);
      prisma.artistTier.findMany
        .mockResolvedValueOnce([{ id: 'tier-a', parentTierId: 'tier-b' }])
        .mockResolvedValueOnce([{ id: 'tier-b', parentTierId: null }]);

      const artwork = await service.findById('artwork-1', 'subscriber-1');

      expect(artwork?.access).toEqual({
        isOwner: false,
        isSubscribed: true,
        canViewFull: true,
      });
      expect(artwork?.images).toHaveLength(1);
      expect(prisma.tierSubscription.findMany).toHaveBeenCalledWith({
        where: {
          subscriberId: 'subscriber-1',
          status: 'ACTIVE',
          artistId: 'artist-1',
        },
        select: { tierId: true },
      });
    });
  });
});
