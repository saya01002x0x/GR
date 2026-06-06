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
  Sse,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Body,
  MessageEvent,
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
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAME } from '../queue/queue.constants';
import { Observable, interval, map, takeWhile, switchMap, from, of } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('artworks')
@Controller('artworks')
export class ArtworksController {
  constructor(
    private readonly artworksService: ArtworksService,
    private readonly viewService: ViewService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAME) private readonly artworkQueue: Queue,
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
   * Get trending/popular artworks (Legacy - keeping for backwards compatibility)
   * GET /artworks/popular?limit=10
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

  // ==================== DISCOVER ENDPOINTS ====================

  @Get('discover/hero')
  @ApiOperation({ summary: 'Get Hero section artworks (Spotlight, Staff Pick, Tutorial)' })
  async getHeroArtworks() {
    const data = await this.artworksService.getHeroArtworks();
    return { message: 'OK', data };
  }

  @Get('discover/featured')
  @ApiOperation({ summary: 'Get currently promoted/featured artworks' })
  async getFeaturedArtworks() {
    const data = await this.artworksService.getFeaturedArtworks();
    return { message: 'OK', data };
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Get ranked artworks' })
  @ApiQuery({ name: 'timeframe', enum: ['daily', 'weekly', 'monthly', 'rookie'] })
  async getRanking(@Query('timeframe') timeframe: string = 'daily') {
    const data = await this.artworksService.getRanking(timeframe);
    return { message: 'OK', data };
  }

  @Get('rising-stars')
  @ApiOperation({ summary: 'Get rising star artists' })
  async getRisingStars() {
    const data = await this.artworksService.getRisingStars();
    return { message: 'OK', data };
  }

  @Get('popular-tags')
  @ApiOperation({ summary: 'Get popular tags' })
  async getPopularTags() {
    const data = await this.artworksService.getPopularTags();
    return { message: 'OK', data };
  }

  /**
   * Search existing tags by keyword (autocomplete)
   * GET /artworks/tags/search?q=ani
   */
  @Get('tags/search')
  @ApiOperation({ summary: 'Search tags for autocomplete' })
  @ApiQuery({ name: 'q', required: true, description: 'Search keyword' })
  async searchTags(@Query('q') q: string) {
    if (!q || q.length < 1) {
      return { message: 'OK', data: [] };
    }
    const tags = await this.prisma.tag.findMany({
      where: { name: { contains: q.toLowerCase(), mode: 'insensitive' } },
      orderBy: { count: 'desc' },
      take: 20,
      select: { name: true, count: true },
    });
    return { message: 'OK', data: tags };
  }

  /**
   * SSE endpoint for real-time job progress
   * GET /artworks/job/:jobId/progress
   */
  @Sse('job/:jobId/progress')
  @ApiOperation({ summary: 'Stream job processing progress via SSE' })
  @ApiParam({ name: 'jobId', description: 'BullMQ Job ID' })
  jobProgress(@Param('jobId') jobId: string): Observable<MessageEvent> {
    return interval(1000).pipe(
      switchMap(() => from(this.artworkQueue.getJob(jobId))),
      map((job) => {
        if (!job) {
          return { data: { phase: 'not_found', message: 'Job not found', percent: 0 } };
        }
        const progress = job.progress as any;
        const state = job.finishedOn ? 'completed' : (job.failedReason ? 'failed' : 'active');
        return {
          data: {
            ...progress,
            state,
            failedReason: job.failedReason || null,
          },
        };
      }),
      takeWhile((event) => {
        const d = event.data as any;
        return d.state !== 'completed' && d.state !== 'failed' && d.phase !== 'not_found';
      }, true), // inclusive: emit the final event before closing
    );
  }

  // ============================================================

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

    return {
      message: 'My artworks',
      data: artworks,
    };
  }

  @Post(':id/promote')
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Promote an artwork (pay for featuring)' })
  @ApiParam({ name: 'id', description: 'Artwork ID' })
  @ApiResponse({ status: 200, description: 'Artwork promoted successfully' })
  @ApiResponse({ status: 403, description: 'Not the owner of the artwork' })
  async promoteArtwork(
    @Param('id') id: string,
    @Body() body: { weeks: number },
    @CurrentUser() user: User,
  ) {
    if (!user.isArtist) {
      return { message: 'Only artists can promote artworks', data: null };
    }

    const result = await this.artworksService.promoteArtwork(id, user.id, body.weeks);

    return {
      message: 'Artwork promoted successfully',
      data: result,
    };
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related artworks' })
  @ApiParam({ name: 'id', description: 'Artwork ID' })
  @ApiResponse({ status: 200, description: 'Related artworks retrieved' })
  async getRelated(@Param('id') id: string, @Req() req: Request) {
    const viewer = await this.authService.getOptionalUser(req);
    const limit = Number(req.query.limit) || 10;

    const related = await this.artworksService.findRelated(id, limit, viewer?.id);

    return {
      message: 'Related artworks',
      data: related,
    };
  }

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
          'image/avif',
          'image/heic',
          'image/heif',
          'image/svg+xml',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error('Invalid file type. Only JPG, PNG, GIF, WebP, AVIF, HEIC, HEIF, SVG allowed.'),
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
      rating: 'SAFE' as ContentRating, // NSFW no longer allowed
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
