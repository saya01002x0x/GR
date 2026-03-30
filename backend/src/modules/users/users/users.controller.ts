/**
 * Users Controller
 * Handle user-related endpoints
 * Reference: https://docs.nestjs.com/controllers
 */

import { Controller, Get, Patch, UseGuards, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ClerkGuard } from '../../auth/clerk/clerk.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
}
