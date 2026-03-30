/**
 * Artworks Service
 * Handle artwork CRUD operations with image processing
 * Reference: https://docs.nestjs.com/providers
 */

import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Artwork, ContentRating, ArtworkStatus } from '@prisma/client';
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
}

export interface CreateArtworkResult {
  artwork: Artwork;
  images: {
    original: string;
    preview: string;
    thumbnail: string;
  };
}

@Injectable()
export class ArtworksService {
  private readonly logger = new Logger(ArtworksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
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
  ): Promise<any> {
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

    // Step 1: Create artwork with PROCESSING status
    const artwork = await this.prisma.artwork.create({
      data: {
        title: dto.title,
        description: dto.description,
        rating: dto.rating,
        isAI: dto.isAI,
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
      await this.queue.add(
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
          removeOnComplete: true,
        },
      );

      this.logger.log(`Added job for artwork ${artwork.id} to queue`);

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
        jobId: 'queued',
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
  async findById(id: string) {
    return this.prisma.artwork.findUnique({
      where: { id },
      include: {
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
      },
    });
  }

  /**
   * Get all published artworks with pagination
   * Default: 25 items per page
   */
  async findAll(options: { limit?: number; offset?: number } = {}) {
    const { limit = 25, offset = 0 } = options;

    const [artworks, total] = await Promise.all([
      this.prisma.artwork.findMany({
        where: { status: 'PUBLISHED' },
        include: {
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
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.artwork.count({
        where: { status: 'PUBLISHED' },
      }),
    ]);

    return {
      artworks,
      total,
      hasMore: offset + artworks.length < total,
    };
  }

  /**
   * Get related artworks by tags (OR logic)
   * Fallback: same author or latest artworks
   */
  async findRelated(artworkId: string, limit = 10) {
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
    let relatedArtworks = await this.prisma.artwork.findMany({
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
      include: {
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
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Fallback: same author or latest
    if (relatedArtworks.length < limit) {
      const remaining = limit - relatedArtworks.length;
      const existingIds = [artworkId, ...relatedArtworks.map((a) => a.id)];

      const fallbackArtworks = await this.prisma.artwork.findMany({
        where: {
          id: { notIn: existingIds },
          status: 'PUBLISHED',
          OR: [
            { authorId: artwork.authorId },
            {}, // Any artwork as last resort
          ],
        },
        include: {
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
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: remaining,
      });

      relatedArtworks = [...relatedArtworks, ...fallbackArtworks];
    }

    return relatedArtworks;
  }

  /**
   * Get artworks by user ID
   */
  async findByUserId(userId: string) {
    return this.prisma.artwork.findMany({
      where: { authorId: userId },
      include: {
        images: {
          take: 1,
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
