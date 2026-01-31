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
   * GET /artworks
   */
  @Get()
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const artworks = await this.artworksService.findAll({
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return {
      message: 'Artworks retrieved successfully',
      data: artworks,
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

  /**
   * Create artwork with image upload
   * POST /artworks
   * Requires: Artist role + Valid Clerk JWT
   */
  @Post()
  @UseGuards(ClerkGuard)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPG, PNG, GIF allowed.'), false);
        }
      },
    }),
  )
  async create(
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { title: string; description?: string; tags: string; rating: ContentRating; isAI: string },
  ) {
    // Parse tags from JSON string or comma-separated
    let tags: string[];
    try {
      tags = JSON.parse(body.tags);
    } catch {
      tags = body.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }

    const dto: CreateArtworkDto = {
      title: body.title,
      description: body.description,
      tags,
      rating: body.rating || 'SAFE',
      isAI: body.isAI === 'true',
    };

    const result = await this.artworksService.create(dto, files, user.id, user.isArtist);

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
