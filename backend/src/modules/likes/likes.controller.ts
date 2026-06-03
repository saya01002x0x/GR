/**
 * Likes Controller
 * Handle like/unlike endpoints
 */

import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { ClerkGuard } from '../auth/clerk.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('likes')
@Controller('artworks')
export class LikesController {
  constructor(private readonly likesService: LikesService) { }

  /**
   * Toggle like on artwork
   * POST /artworks/:id/like
   */
  @Post(':id/like')
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Toggle like on artwork' })
  @ApiParam({ name: 'id', description: 'Artwork ID' })
  @ApiResponse({ status: 200, description: 'Like toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async toggleLike(@Param('id') artworkId: string, @CurrentUser() user: User) {
    const result = await this.likesService.toggleLike(user.id, artworkId);
    return {
      message: result.liked ? 'Artwork liked' : 'Artwork unliked',
      data: result,
    };
  }

  /**
   * Get like status
   * GET /artworks/:id/like-status
   */
  @Get(':id/like-status')
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Get like status for artwork' })
  @ApiParam({ name: 'id', description: 'Artwork ID' })
  @ApiResponse({ status: 200, description: 'Like status retrieved' })
  async getLikeStatus(
    @Param('id') artworkId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.likesService.getLikeStatus(user.id, artworkId);
    return {
      message: 'Like status retrieved',
      data: result,
    };
  }
}
