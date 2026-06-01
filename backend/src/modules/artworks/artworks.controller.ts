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
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { ClerkGuard } from '../auth/clerk.guard';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ArtworksService, CreateArtworkDto } from './artworks.service';
import { ViewService } from '../stats/view.service';
import type { User, ContentRating, ArtworkVisibility } from '@prisma/client';
import type { Request } from 'express';

@ApiTags('artworks')
@Controller('artworks')
export class ArtworksController {
  constructor(
    private readonly artworksService: ArtworksService,
    private readonly viewService: ViewService,
    private readonly authService: AuthService,
  ) { }

  /**
   * Get all published artworks
   * GET /artworks?limit=25&offset=0
   */
  @Get()
  @ApiOperation({ summary: 'Get all published artworks' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of artworks (default: 25)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset for pagination',
  })
  @ApiResponse({ status: 200, description: 'Artworks retrieved successfully' })
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: Request,
  ) {
    const viewer = req ? await this.authService.getOptionalUser(req) : null;
    const result = await this.artworksService.findAll({
      limit: limit ? parseInt(limit, 10) : 25,
      offset: offset ? parseInt(offset, 10) : 0,
      viewerId: viewer?.id,
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
 * Get trending/popular artworks
 * GET /artworks/popular?limit=10
 * @description This get all of the artworks, timerannge is not implemented yet
 * @todo implement timerannge
 */
  @Get('popular')
  @ApiOperation({ summary: 'Get trending artworks' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Trending artworks retrieved' })
  async findTrending(@Query('limit') limit?: string) {
    const artworks = await this.artworksService.findTrending(
      limit ? parseInt(limit, 10) : 10,
    );

    return {
      message: 'Trending artworks retrieved successfully',
      data: artworks,
    };
  }

  /**
   * Get related artworks by ID
   * GET /artworks/:id/related
   */
  @Get(':id/related')
  @ApiOperation({ summary: 'Get related artworks' })
  @ApiParam({ name: 'id', description: 'Artwork ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of related artworks',
  })
  @ApiResponse({ status: 200, description: 'Related artworks retrieved' })
  async findRelated(@Param('id') id: string, @Query('limit') limit?: string, @Req() req?: Request) {
    const viewer = req ? await this.authService.getOptionalUser(req) : null;
    const relatedArtworks = await this.artworksService.findRelated(
      id,
      limit ? parseInt(limit, 10) : 10,
      viewer?.id,
    );

    return {
      message: 'Related artworks retrieved successfully',
      data: relatedArtworks,
    };
  }

  /**
   * Get current user's artworks
   * GET /artworks/user/me
   */
  @Get('user/me')
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Get my artworks' })
  @ApiResponse({ status: 200, description: 'My artworks retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyArtworks(@CurrentUser() user: User) {
    const artworks = await this.artworksService.findByUserId(user.id);

    // Transform artworks to include thumbnailUrl for frontend
    const transformedArtworks = artworks.map((artwork) => ({
      id: artwork.id,
      title: artwork.title,
      status: artwork.status,
      createdAt: artwork.createdAt,
      thumbnailUrl: artwork.thumbnailUrl || null,
    }));

    return {
      message: 'My artworks',
      data: transformedArtworks,
    };
  }

  /**
   * Get artwork by ID
   * GET /artworks/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get artwork by ID' })
  @ApiParam({ name: 'id', description: 'Artwork ID' })
  @ApiResponse({ status: 200, description: 'Artwork retrieved' })
  @ApiResponse({ status: 404, description: 'Artwork not found' })
  async findById(@Param('id') id: string, @Req() req: Request) {
    const viewer = await this.authService.getOptionalUser(req);
    const artwork = await this.artworksService.findById(id, viewer?.id);

    if (!artwork) {
      return {
        message: 'Artwork not found',
        data: null,
      };
    }

    // Track view: extract userId from Clerk auth (optional), fallback to IP
    const userId = (req as unknown as { auth?: { userId?: string } }).auth
      ?.userId;
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    // Fire-and-forget: don't block response for view tracking
    void this.viewService.recordView(id, userId, ip).catch(() => { });

    return {
      message: 'Artwork retrieved successfully',
      data: artwork,
    };
  }

  @Post()
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Create new artwork with images' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Artwork created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not an artist' })
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      // Increased to 20 for manga
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error('Invalid file type. Only JPG, PNG, GIF, WebP allowed.'),
            false,
          );
        }
      },
    }),
  )
  async create(
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
    @Body()
    body: {
      title: string;
      description?: string;
      tags: string;
      rating: ContentRating;
      isAI: string;
      visibility?: ArtworkVisibility;
      requiredTierId?: string;
      metadata?: string; // JSON string: [{ order: 0, caption: '' }, ...]
    },
  ) {
    // Parse tags from JSON string or comma-separated
    let tags: string[];
    try {
      tags = JSON.parse(body.tags) as unknown as string[];
    } catch {
      tags = body.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    }

    let metadata: {
      order: number;
      caption?: string;
      watermark?: {
        enabled: boolean;
        position: string;
        opacity: number;
        size: number;
      };
    }[] = [];
    if (body.metadata) {
      try {
        metadata = JSON.parse(body.metadata) as unknown as typeof metadata;
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
      visibility: body.visibility || 'PUBLIC',
      requiredTierId: body.requiredTierId,
    };

    const result = await this.artworksService.create(
      dto,
      files,
      metadata,
      user.id,
      user.isArtist,
    );

    return {
      message: 'Artwork created successfully',
      data: result,
    };
  }

}
