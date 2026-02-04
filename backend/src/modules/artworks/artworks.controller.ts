/**
 * Artworks Controller
 * Handle artwork endpoints with authentication
 * Reference: https://docs.nestjs.com/controllers
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ClerkGuard } from '../auth/clerk/clerk.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ArtworksService, CreateArtworkDto } from './artworks.service';
import type { User, ContentRating } from '@prisma/client';

@Controller('artworks')
export class ArtworksController {
  constructor(private readonly artworksService: ArtworksService) { }

  /**
   * Get all published artworks
   * GET /artworks?limit=25&offset=0
   */
  @Get()
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.artworksService.findAll({
      limit: limit ? parseInt(limit, 10) : 25,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return {
      message: 'Artworks retrieved successfully',
      data: result.artworks,
      pagination: {
        total: result.total,
        hasMore: result.hasMore,
      },
    };
  }

  /**
   * Get related artworks by ID
   * GET /artworks/:id/related
   */
  @Get(':id/related')
  async findRelated(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const relatedArtworks = await this.artworksService.findRelated(
      id,
      limit ? parseInt(limit, 10) : 10,
    );

    return {
      message: 'Related artworks retrieved successfully',
      data: relatedArtworks,
    };
  }

  /**
   * Get artwork by ID
   * GET /artworks/:id
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    const artwork = await this.artworksService.findById(id);

    if (!artwork) {
      return {
        message: 'Artwork not found',
        data: null,
      };
    }

    return {
      message: 'Artwork retrieved successfully',
      data: artwork,
    };
  }

  @Post()
  @UseGuards(ClerkGuard)
  @UseInterceptors(
    FilesInterceptor('images', 20, {  // Increased to 20 for manga
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPG, PNG, GIF, WebP allowed.'), false);
        }
      },
    }),
  )
  async create(
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { 
      title: string; 
      description?: string; 
      tags: string; 
      rating: ContentRating; 
      isAI: string;
      metadata?: string;  // JSON string: [{ order: 0, caption: '' }, ...]
    },
  ) {
    // Parse tags from JSON string or comma-separated
    let tags: string[];
    try {
      tags = JSON.parse(body.tags);
    } catch {
      tags = body.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }

    // Parse metadata for image ordering (optional, defaults to upload order)
    let metadata: { order: number; caption?: string }[] = [];
    if (body.metadata) {
      try {
        metadata = JSON.parse(body.metadata);
      } catch {
        // Invalid metadata, use default order
        metadata = files.map((_, i) => ({ order: i }));
      }
    } else {
      // No metadata, use upload order
      metadata = files.map((_, i) => ({ order: i }));
    }

    const dto: CreateArtworkDto = {
      title: body.title,
      description: body.description,
      tags,
      rating: body.rating || 'SAFE',
      isAI: body.isAI === 'true',
    };

    const result = await this.artworksService.create(dto, files, metadata, user.id, user.isArtist);

    return {
      message: 'Artwork created successfully',
      data: result,
    };
  }

  /**
   * Get current user's artworks
   * GET /artworks/user/me
   */
  @Get('user/me')
  @UseGuards(ClerkGuard)
  async getMyArtworks(@CurrentUser() user: User) {
    const artworks = await this.artworksService.findByUserId(user.id);

    // Transform artworks to include thumbnailUrl for frontend
    const transformedArtworks = artworks.map(artwork => ({
      id: artwork.id,
      title: artwork.title,
      status: artwork.status,
      createdAt: artwork.createdAt,
      thumbnailUrl: artwork.images[0]?.thumbnailUrl || null,
    }));

    return {
      message: 'My artworks',
      data: transformedArtworks,
    };
  }
}
