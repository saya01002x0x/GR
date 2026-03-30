/**
 * Collections Service
 * Handle collection CRUD with auto-create "Favorites"
 */

import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateCollectionDto {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all collections for user
   * Auto-creates "Favorites" if user has no collections
   */
  async getUserCollections(userId: string) {
    // Check if user has any collections
    let collections = await this.prisma.collection.findMany({
      where: { userId },
      include: {
        _count: { select: { bookmarks: true } },
      },
      orderBy: [
        { isDefault: 'desc' }, // Favorites first
        { createdAt: 'desc' },
      ],
    });

    // Auto-create Favorites if no collections
    if (collections.length === 0) {
      const favorites = await this.prisma.collection.create({
        data: {
          name: 'Favorites',
          description: 'Your favorite artworks',
          isPrivate: true,
          isDefault: true,
          userId,
        },
        include: {
          _count: { select: { bookmarks: true } },
        },
      });

      this.logger.log(`Auto-created Favorites collection for user ${userId}`);
      collections = [favorites];
    }

    return collections.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      isPrivate: c.isPrivate,
      isDefault: c.isDefault,
      artworkCount: c._count.bookmarks,
      createdAt: c.createdAt,
    }));
  }

  /**
   * Create a new collection
   */
  async createCollection(userId: string, dto: CreateCollectionDto) {
    const collection = await this.prisma.collection.create({
      data: {
        name: dto.name,
        description: dto.description,
        isPrivate: dto.isPrivate ?? true,
        isDefault: false,
        userId,
      },
    });

    this.logger.log(`User ${userId} created collection ${collection.id}`);

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isPrivate: collection.isPrivate,
      isDefault: collection.isDefault,
      artworkCount: 0,
    };
  }

  /**
   * Update a collection (not Favorites)
   */
  async updateCollection(
    userId: string,
    collectionId: string,
    dto: UpdateCollectionDto,
  ) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('You can only update your own collections');
    }

    if (collection.isDefault) {
      throw new ForbiddenException('Cannot edit Favorites collection');
    }

    const updated = await this.prisma.collection.update({
      where: { id: collectionId },
      data: {
        name: dto.name,
        description: dto.description,
        isPrivate: dto.isPrivate,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      isPrivate: updated.isPrivate,
      isDefault: updated.isDefault,
    };
  }

  /**
   * Delete a collection (not Favorites)
   */
  async deleteCollection(userId: string, collectionId: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('You can only delete your own collections');
    }

    if (collection.isDefault) {
      throw new ForbiddenException('Cannot delete Favorites collection');
    }

    await this.prisma.collection.delete({
      where: { id: collectionId },
    });

    this.logger.log(`User ${userId} deleted collection ${collectionId}`);

    return { deleted: true };
  }

  /**
   * Add artwork to collection
   */
  async addArtworkToCollection(
    userId: string,
    collectionId: string,
    artworkId: string,
  ) {
    // Verify collection ownership
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection || collection.userId !== userId) {
      throw new ForbiddenException('Collection not found or not yours');
    }

    // Check if already saved
    const existingBookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_artworkId_collectionId: { userId, artworkId, collectionId },
      },
    });

    if (existingBookmark) {
      return { added: false, message: 'Already in collection' };
    }

    await this.prisma.bookmark.create({
      data: { userId, artworkId, collectionId },
    });

    this.logger.log(
      `User ${userId} added artwork ${artworkId} to collection ${collectionId}`,
    );

    return { added: true };
  }

  /**
   * Remove artwork from collection
   */
  async removeArtworkFromCollection(
    userId: string,
    collectionId: string,
    artworkId: string,
  ) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_artworkId_collectionId: { userId, artworkId, collectionId },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Artwork not in this collection');
    }

    if (bookmark.userId !== userId) {
      throw new ForbiddenException('Not your bookmark');
    }

    await this.prisma.bookmark.delete({
      where: {
        userId_artworkId_collectionId: { userId, artworkId, collectionId },
      },
    });

    this.logger.log(
      `User ${userId} removed artwork ${artworkId} from collection ${collectionId}`,
    );

    return { removed: true };
  }

  /**
   * Get which collections contain an artwork (for current user)
   */
  async getArtworkCollections(userId: string, artworkId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId, artworkId },
      select: { collectionId: true },
    });

    return bookmarks.map((b) => b.collectionId);
  }
}
