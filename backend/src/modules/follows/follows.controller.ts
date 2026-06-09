import { Controller, Get, Post, UseGuards, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { FollowsService } from './follows.service';
import { ClerkGuard } from '../auth/clerk.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('Follows')
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':userId/toggle')
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Toggle follow status for a user' })
  @ApiResponse({ status: 200, description: 'Follow status toggled' })
  async toggleFollow(@CurrentUser() user: User, @Param('userId') followingId: string) {
    return this.followsService.toggleFollow(user.id, followingId);
  }

  @Get(':userId/status')
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Get follow status for a user' })
  @ApiResponse({ status: 200, description: 'Follow status retrieved' })
  async getFollowStatus(@CurrentUser() user: User, @Param('userId') followingId: string) {
    return this.followsService.getFollowStatus(user.id, followingId);
  }

  @Get('me/followers')
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Get list of users who follow me' })
  @ApiResponse({ status: 200, description: 'Followers retrieved' })
  async getFollowers(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followsService.getFollowers(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('me/following')
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Get list of users I am following' })
  @ApiResponse({ status: 200, description: 'Following retrieved' })
  async getFollowing(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followsService.getFollowing(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('me/feed')
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Get artwork feed from following users' })
  @ApiResponse({ status: 200, description: 'Feed retrieved' })
  async getFeed(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followsService.getFeed(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 24,
    );
  }
}
