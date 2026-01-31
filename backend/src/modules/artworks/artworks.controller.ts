/**
 * Artworks Controller
 * Example controller demonstrating Clerk authentication with Lazy Sync
 * Reference: https://docs.nestjs.com/controllers
 */

import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { ClerkGuard } from '../auth/clerk/clerk.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { CreateArtworkDto } from '@gr/shared';

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
   * Returns: DB User (đã được Lazy Sync)
   */
  @Get('me')
  @UseGuards(ClerkGuard)
  findMyArtworks(@CurrentUser() user: User) {
    return {
      message: 'My artworks (authenticated)',
      user: {
        id: user.id, // UUID từ Database
        clerkId: user.clerkId,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        isArtist: user.isArtist,
        createdAt: user.createdAt,
      },
      data: [],
    };
  }

  /**
   * Protected endpoint - Create artwork
   * POST /artworks
   * Requires: Valid Clerk JWT token
   * Body validation via @gr/shared CreateArtworkDto
   */
  @Post()
  @UseGuards(ClerkGuard)
  create(@CurrentUser() user: User, @Body() createDto: CreateArtworkDto) {
    return {
      message: 'Artwork created',
      artwork: {
        ...createDto,
        authorId: user.id, // UUID từ Database để liên kết với Artwork
        createdBy: user.displayName || user.username,
      },
    };
  }
}
