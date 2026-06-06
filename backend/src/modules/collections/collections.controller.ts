/**
 * Collections Controller
 * Handle collection endpoints
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import type {
  CreateCollectionDto,
  UpdateCollectionDto,
} from './collections.service';
import { ClerkGuard } from '../auth/clerk.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('collections')
@ApiBearerAuth('clerk-auth')
@Controller('collections')
@UseGuards(ClerkGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  /**
   * Get user's collections
   * GET /collections
   */
  @Get()
  @ApiOperation({ summary: 'Get my collections' })
  @ApiResponse({ status: 200, description: 'Collections retrieved' })
  async getUserCollections(@CurrentUser() user: User) {
    const collections = await this.collectionsService.getUserCollections(
      user.id,
    );
    return {
      message: 'Collections retrieved',
      data: collections,
    };
  }

  /**
   * Get collection membership for an artwork
   * GET /collections/artworks/:artworkId/status
   */
  @Get('artworks/:artworkId/status')
  @ApiOperation({ summary: 'Get collection status for an artwork' })
  @ApiParam({ name: 'artworkId', description: 'Artwork ID' })
  @ApiResponse({ status: 200, description: 'Artwork collection status retrieved' })
  async getArtworkCollectionStatus(
    @Param('artworkId') artworkId: string,
    @CurrentUser() user: User,
  ) {
    const collectionIds = await this.collectionsService.getArtworkCollections(
      user.id,
      artworkId,
    );

    return {
      message: 'Artwork collection status retrieved',
      data: {
        isSaved: collectionIds.length > 0,
        collectionIds,
      },
    };
  }

  /**
   * Create a new collection
   * POST /collections
   */
  @Post()
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiResponse({ status: 201, description: 'Collection created' })
  async createCollection(
    @Body() dto: CreateCollectionDto,
    @CurrentUser() user: User,
  ) {
    const collection = await this.collectionsService.createCollection(
      user.id,
      dto,
    );
    return {
      message: 'Collection created',
      data: collection,
    };
  }

  /**
   * Update a collection
   * PATCH /collections/:id
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiResponse({ status: 200, description: 'Collection updated' })
  async updateCollection(
    @Param('id') collectionId: string,
    @Body() dto: UpdateCollectionDto,
    @CurrentUser() user: User,
  ) {
    const collection = await this.collectionsService.updateCollection(
      user.id,
      collectionId,
      dto,
    );
    return {
      message: 'Collection updated',
      data: collection,
    };
  }

  /**
   * Delete a collection
   * DELETE /collections/:id
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiResponse({ status: 200, description: 'Collection deleted' })
  async deleteCollection(
    @Param('id') collectionId: string,
    @CurrentUser() user: User,
  ) {
    await this.collectionsService.deleteCollection(user.id, collectionId);
    return {
      message: 'Collection deleted',
    };
  }

  /**
   * Add artwork to collection
   * POST /collections/:id/artworks
   */
  @Post(':id/artworks')
  @ApiOperation({ summary: 'Add artwork to collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiResponse({ status: 200, description: 'Artwork added' })
  async addArtwork(
    @Param('id') collectionId: string,
    @Body('artworkId') artworkId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.collectionsService.addArtworkToCollection(
      user.id,
      collectionId,
      artworkId,
    );
    return {
      message: result.added
        ? 'Artwork added to collection'
        : 'Already in collection',
      data: result,
    };
  }

  /**
   * Remove artwork from collection
   * DELETE /collections/:id/artworks/:artworkId
   */
  @Delete(':id/artworks/:artworkId')
  @ApiOperation({ summary: 'Remove artwork from collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiParam({ name: 'artworkId', description: 'Artwork ID' })
  @ApiResponse({ status: 200, description: 'Artwork removed' })
  async removeArtwork(
    @Param('id') collectionId: string,
    @Param('artworkId') artworkId: string,
    @CurrentUser() user: User,
  ) {
    await this.collectionsService.removeArtworkFromCollection(
      user.id,
      collectionId,
      artworkId,
    );
    return {
      message: 'Artwork removed from collection',
    };
  }
}
