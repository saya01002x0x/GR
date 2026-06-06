import { NotFoundException } from '@nestjs/common';
import { ArtworkStatus, ArtworkVisibility } from '@prisma/client';
import { ArtworksService } from './artworks.service';

describe('ArtworksService', () => {
  const prisma = {
    artwork: {
      findUnique: jest.fn(),
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
  });
});
