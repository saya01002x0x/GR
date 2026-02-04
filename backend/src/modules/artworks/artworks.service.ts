/**
 * Artworks Service
 * Handle artwork CRUD operations with image processing
 * Reference: https://docs.nestjs.com/providers
 */

import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Artwork, ContentRating, ArtworkStatus } from '@prisma/client';

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
    ) { }

    /**
     * Create artwork with multiple images
     * Images are matched with metadata by INDEX (not originalName)
     * Transaction-safe: DRAFT -> Upload -> PUBLISHED
     */
    async create(
        dto: CreateArtworkDto,
        files: Express.Multer.File[],
        metadata: { order: number; caption?: string }[],
        userId: string,
        isArtist: boolean,
    ): Promise<CreateArtworkResult> {
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

        // Step 1: Create artwork with DRAFT status
        const artwork = await this.prisma.artwork.create({
            data: {
                title: dto.title,
                description: dto.description,
                rating: dto.rating,
                isAI: dto.isAI,
                status: 'DRAFT' as ArtworkStatus,
                authorId: userId,
            },
        });

        this.logger.log(`Created artwork DRAFT: ${artwork.id} with ${files.length} images`);

        try {
            // Step 2: Process ALL images in parallel
            // Match by INDEX: files[i] corresponds to metadata[i]
            const processedImages = await Promise.all(
                files.map(async (file, index) => {
                    const [processed, thumbnail] = await Promise.all([
                        this.storageService.processImage(file.buffer, { maxWidth: 1200, quality: 80 }),
                        this.storageService.createThumbnail(file.buffer, 400),
                    ]);

                    // Generate paths with index for uniqueness
                    const previewPath = this.storageService.generateArtworkPath(userId, artwork.id, `preview_${index}`);
                    const thumbPath = this.storageService.generateArtworkPath(userId, artwork.id, `thumb_${index}`);

                    // Upload to MinIO
                    const [previewUrl, thumbUrl] = await Promise.all([
                        this.storageService.uploadFile(processed.buffer, previewPath),
                        this.storageService.uploadFile(thumbnail, thumbPath),
                    ]);

                    return {
                        url: previewUrl,
                        thumbnailUrl: thumbUrl,
                        width: processed.metadata.width,
                        height: processed.metadata.height,
                        aspectRatio: processed.metadata.aspectRatio,
                        order: metadata[index]?.order ?? index,
                        caption: metadata[index]?.caption || null,
                    };
                })
            );

            this.logger.log(`Uploaded ${processedImages.length} images for artwork: ${artwork.id}`);

            // Step 3: Create tags
            const tagRecords = await Promise.all(
                dto.tags.map(tagName =>
                    this.prisma.tag.upsert({
                        where: { name: tagName },
                        update: {},
                        create: { name: tagName },
                    }),
                ),
            );

            // Step 4: Transaction - create images, tags, publish
            await (this.prisma.$transaction as any)([
                // Create ALL image records
                ...processedImages.map(img =>
                    (this.prisma.artworkImage.create as any)({
                        data: {
                            artworkId: artwork.id,
                            url: img.url,
                            thumbnailUrl: img.thumbnailUrl,
                            width: img.width,
                            height: img.height,
                            aspectRatio: img.aspectRatio,
                            order: img.order,
                        },
                    }),
                ),
                // Create tag relations
                ...tagRecords.map((tag, index) =>
                    (this.prisma.artworkTag.create as any)({
                        data: {
                            artworkId: artwork.id,
                            tagId: tag.id,
                            order: index,
                        },
                    }),
                ),
                // Update status to PUBLISHED
                (this.prisma.artwork.update as any)({
                    where: { id: artwork.id },
                    data: { status: 'PUBLISHED' as ArtworkStatus },
                }),
            ]);

            this.logger.log(`Published artwork: ${artwork.id} with ${processedImages.length} images`);

            return {
                artwork: { ...artwork, status: 'PUBLISHED' as ArtworkStatus },
                images: {
                    original: processedImages[0]?.url || '',
                    preview: processedImages[0]?.url || '',
                    thumbnail: processedImages[0]?.thumbnailUrl || '',
                },
            };
        } catch (error) {
            // Cleanup on failure
            this.logger.error(`Failed to create artwork: ${error.message}`);

            // Delete draft artwork (cascade deletes images)
            await this.prisma.artwork.delete({ where: { id: artwork.id } }).catch(() => { });

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

        const tagNames = artwork.tags.map(t => t.tag.name);

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
            const existingIds = [artworkId, ...relatedArtworks.map(a => a.id)];

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
