/**
 * Comments Controller
 * Handle comment endpoints with pagination
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import type { CreateCommentDto } from './comments.service';
import { ClerkGuard } from '../auth/clerk.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Get comments for artwork
   * GET /artworks/:id/comments?parentId=null&limit=3&offset=0
   */
  @Get('artworks/:id/comments')
  @ApiOperation({ summary: 'Get comments for artwork' })
  @ApiParam({ name: 'id', description: 'Artwork ID' })
  @ApiQuery({
    name: 'parentId',
    required: false,
    description: 'Parent comment ID for replies',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of comments to return',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset for pagination',
  })
  @ApiResponse({ status: 200, description: 'Comments retrieved' })
  async getComments(
    @Param('id') artworkId: string,
    @Query('parentId') parentId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.commentsService.getComments(
      artworkId,
      parentId === 'null' || !parentId ? null : parentId,
      limit ? parseInt(limit, 10) : 3,
      offset ? parseInt(offset, 10) : 0,
    );

    return {
      message: 'Comments retrieved',
      data: result.comments,
      pagination: {
        hasMore: result.hasMore,
        total: result.total,
      },
    };
  }

  /**
   * Create a comment or reply
   * POST /artworks/:id/comments
   */
  @Post('artworks/:id/comments')
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Create a comment or reply' })
  @ApiParam({ name: 'id', description: 'Artwork ID' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createComment(
    @Param('id') artworkId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    const comment = await this.commentsService.createComment(
      user.id,
      artworkId,
      dto,
    );

    return {
      message: 'Comment created',
      data: comment,
    };
  }

  /**
   * Delete a comment
   * DELETE /comments/:id
   */
  @Delete('comments/:id')
  @UseGuards(ClerkGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the comment owner' })
  async deleteComment(
    @Param('id') commentId: string,
    @CurrentUser() user: User,
  ) {
    await this.commentsService.deleteComment(user.id, commentId);

    return {
      message: 'Comment deleted',
    };
  }
}
