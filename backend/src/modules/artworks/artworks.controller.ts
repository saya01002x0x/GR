/**
 * Artworks Controller
 * Example controller demonstrating Clerk authentication
 * Reference: https://docs.nestjs.com/controllers
 */

import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { ClerkGuard } from '../auth/clerk/clerk.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserPayload } from '../../common/decorators/current-user.decorator';

@Controller('artworks')
export class ArtworksController {
  /**
   * Public endpoint - No authentication required
   * GET /artworks
   */
  @Get()
  findAll() {
    return {
      message: 'List all artworks (public)',
      data: [],
    };
  }

  /**
   * Protected endpoint - Authentication required
   * GET /artworks/me
   * Requires: Valid Clerk JWT token
   */
  @Get('me')
  @UseGuards(ClerkGuard)
  findMyArtworks(@CurrentUser() user: UserPayload) {
    return {
      message: 'My artworks (authenticated)',
      user: {
        id: user.userId,
        email: user.email,
        name: user.fullName,
      },
      data: [],
    };
  }

  /**
   * Protected endpoint - Create artwork
   * POST /artworks
   * Requires: Valid Clerk JWT token
   */
  @Post()
  @UseGuards(ClerkGuard)
  create(@CurrentUser() user: UserPayload, @Body() createDto: any) {
    return {
      message: 'Artwork created',
      artwork: {
        ...createDto,
        userId: user.userId,
        createdBy: user.fullName,
      },
    };
  }
}
