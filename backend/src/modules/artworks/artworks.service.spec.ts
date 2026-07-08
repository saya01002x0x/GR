import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ArtworkStatus, ArtworkVisibility, ContentRating } from '@prisma/client';
import { ArtworksService } from './artworks.service';

describe('ArtworksService', () => {
  const prisma = {
    artwork: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    tierSubscription: {
      findMany: jest.fn(),
    },
    artistTier: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    tag: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    artworkTag: {
      createMany: jest.fn(),
    },
  };

  const storageService = {
    uploadRaw: jest.fn(),
  };

  const queue = {
    add: jest.fn(),
  };

  const service = new ArtworksService(
    prisma as any,
    storageService as any,
    {} as any,
    {} as any,
    queue as any,
    {} as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create (Upload)', () => {
    const validDto = {
      title: 'Test Artwork',
      description: 'A test artwork',
      tags: ['test', 'artwork'],
      rating: ContentRating.SAFE,
      isAI: false,
      visibility: ArtworkVisibility.PUBLIC,
    };
    const validFiles = [{ originalname: 'test.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('test') }] as Express.Multer.File[];
    const validMetadata = [{ order: 0 }];

    it('TC01: throws ForbiddenException when uploaded by a non-artist', async () => {
      await expect(
        service.create(validDto, validFiles, validMetadata, 'user-1', false)
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create(validDto, validFiles, validMetadata, 'user-1', false)
      ).rejects.toThrow('Only artists can upload artworks');
    });

    it('TC02: throws BadRequestException when tags are empty', async () => {
      await expect(
        service.create({ ...validDto, tags: [] }, validFiles, validMetadata, 'artist-1', true)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create({ ...validDto, tags: [] }, validFiles, validMetadata, 'artist-1', true)
      ).rejects.toThrow('At least 1 tag is required');
    });

    it('TC03: throws BadRequestException when images are empty', async () => {
      await expect(
        service.create(validDto, [], validMetadata, 'artist-1', true)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(validDto, [], validMetadata, 'artist-1', true)
      ).rejects.toThrow('At least 1 image is required');
    });

    it('TC04: throws BadRequestException for TIER_GATED without tierId', async () => {
      await expect(
        service.create(
          { ...validDto, visibility: ArtworkVisibility.TIER_GATED },
          validFiles,
          validMetadata,
          'artist-1',
          true
        )
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(
          { ...validDto, visibility: ArtworkVisibility.TIER_GATED },
          validFiles,
          validMetadata,
          'artist-1',
          true
        )
      ).rejects.toThrow('Tier-gated artwork must have a required tier');
    });

    it('TC05: creates artwork and pushes job to queue for valid payload', async () => {
      prisma.artwork.create.mockResolvedValue({ id: 'artwork-new' });
      queue.add.mockResolvedValue({ id: 'job-123' });
      storageService.uploadRaw.mockResolvedValue(true);
      prisma.tag.upsert.mockResolvedValue({ id: 'tag-1', name: 'test' });
      prisma.tag.findMany.mockResolvedValue([{ id: 'tag-1', name: 'test' }]);
      prisma.artwork.delete.mockResolvedValue({});
      prisma.artworkTag.createMany.mockResolvedValue({ count: 2 });

      const result = await service.create(validDto, validFiles, validMetadata, 'artist-1', true);

      expect(result.message).toBe('Upload successful. Processing in background.');
      expect(result.jobId).toBe('job-123');
      expect(prisma.artwork.create).toHaveBeenCalled();
      expect(storageService.uploadRaw).toHaveBeenCalled();
      expect(queue.add).toHaveBeenCalled();
    });
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
