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
import { CollectionsService } from './collections.service';
import type { CreateCollectionDto, UpdateCollectionDto } from './collections.service';
import { ClerkGuard } from '../auth/clerk/clerk.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('collections')
@UseGuards(ClerkGuard)
export class CollectionsController {
    constructor(private readonly collectionsService: CollectionsService) { }

    /**
     * Get user's collections
     * GET /collections
     */
    @Get()
    async getUserCollections(@CurrentUser() user: User) {
        const collections = await this.collectionsService.getUserCollections(user.id);
        return {
            message: 'Collections retrieved',
            data: collections,
        };
    }

    /**
     * Create a new collection
     * POST /collections
     */
    @Post()
    async createCollection(
        @Body() dto: CreateCollectionDto,
        @CurrentUser() user: User,
    ) {
        const collection = await this.collectionsService.createCollection(user.id, dto);
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
            message: result.added ? 'Artwork added to collection' : 'Already in collection',
            data: result,
        };
    }

    /**
     * Remove artwork from collection
     * DELETE /collections/:id/artworks/:artworkId
     */
    @Delete(':id/artworks/:artworkId')
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
