/**
 * Likes Controller
 * Handle like/unlike endpoints
 */

import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { LikesService } from './likes.service';
import { ClerkGuard } from '../auth/clerk/clerk.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('artworks')
export class LikesController {
    constructor(private readonly likesService: LikesService) { }

    /**
     * Toggle like on artwork
     * POST /artworks/:id/like
     */
    @Post(':id/like')
    @UseGuards(ClerkGuard)
    async toggleLike(
        @Param('id') artworkId: string,
        @CurrentUser() user: User,
    ) {
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
