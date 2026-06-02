/**
 * Users Controller
 * Handle user-related endpoints
 * Reference: https://docs.nestjs.com/controllers
 */

import { Controller, Get, Patch, UseGuards, Body, Param, Query, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ClerkGuard } from '../auth/clerk.guard';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import type { Request } from 'express';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Get current authenticated user
   * GET /users/me
   */
  @Get('me')
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() user: User) {
    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      isArtist: user.isArtist,
      role: user.role,
      warningCount: user.warningCount,
      isBanned: user.isBanned,
      bannedUntil: user.bannedUntil,
      createdAt: user.createdAt,
    };
  }

  /**
   * Become an Artist (upgrade user)
   * PATCH /users/become-artist
   * Requires agreeing to terms
   */
  @Patch('become-artist')
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Upgrade to Artist account' })
  @ApiResponse({ status: 200, description: 'Successfully became an artist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async becomeArtist(
    @CurrentUser() user: User,
    @Body() body: { agreedToTerms: boolean },
  ) {
    if (!body.agreedToTerms) {
      return {
        success: false,
        message: 'You must agree to the Artist Terms & Conditions',
      };
    }

    const updatedUser = await this.usersService.becomeArtist(user.id);

    return {
      success: true,
      message: 'Congratulations! You are now an Artist.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        isArtist: updatedUser.isArtist,
      },
    };
  }
  /**
   * Get list of artists
   * GET /users/artists
   */
  @Get('artists')
  @ApiOperation({ summary: 'Get list of artists' })
  @ApiResponse({ status: 200, description: 'Artists retrieved' })
  async findArtists() {
    const artists = await this.usersService.findArtists();
    return {
      message: 'Artists retrieved successfully',
      data: artists,
    };
  }

  @Get('artists/:identifier')
  @ApiOperation({ summary: 'Get public artist detail' })
  @ApiResponse({ status: 200, description: 'Artist detail retrieved' })
  async findArtistDetail(@Param('identifier') identifier: string, @Req() req: Request) {
    const viewer = await this.authService.getOptionalUser(req);
    const artist = await this.usersService.findPublicArtistDetail(identifier, viewer?.id);

    return {
      message: 'Artist detail retrieved successfully',
      data: artist,
    };
  }

  @Get('artists/:identifier/artworks')
  @ApiOperation({ summary: 'Get artist artworks for public detail page' })
  @ApiResponse({ status: 200, description: 'Artist artworks retrieved' })
  async findArtistArtworks(
    @Param('identifier') identifier: string,
    @Query('filter') filter: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query('offset') offset: string | undefined,
    @Req() req: Request,
  ) {
    const viewer = await this.authService.getOptionalUser(req);
    const parsedFilter = filter && filter !== 'all'
      ? filter === 'free'
        ? { visibility: 'free' as const }
        : { tierId: filter }
      : { visibility: 'all' as const };

    const result = await this.usersService.findArtistArtworks(
      identifier,
      {
        ...parsedFilter,
        limit: limit ? Number.parseInt(limit, 10) : 24,
        offset: offset ? Number.parseInt(offset, 10) : 0,
      },
      viewer?.id,
    );

    return {
      message: 'Artist artworks retrieved successfully',
      data: result.artworks,
      pagination: {
        total: result.total,
        hasMore: result.hasMore,
      },
    };
  }
}
