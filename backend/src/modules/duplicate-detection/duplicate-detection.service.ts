/**
 * Duplicate Detection Service
 * Uses perceptual hashing (pHash) to detect duplicate/near-duplicate images
 * Reference: https://github.com/nicolo-ribaudo/sharp-phash
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import phash from 'sharp-phash';
import dist from 'sharp-phash/distance';

interface DuplicateResult {
  artworkId: string;
  imageId: string;
  existingHash: string;
  distance: number;
}

@Injectable()
export class DuplicateDetectionService {
  private readonly logger = new Logger(DuplicateDetectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate perceptual hash from image buffer
   * Returns a hex string representing the image fingerprint
   */
  async generateHash(buffer: Buffer): Promise<string> {
    try {
      const hash = await phash(buffer);
      this.logger.debug(`Generated phash: ${hash}`);
      return hash;
    } catch (error) {
      this.logger.error('Failed to generate phash', error);
      throw error;
    }
  }

  /**
   * Find duplicate images by comparing Hamming distance
   * @param hash - The phash of the new image
   * @param threshold - Max Hamming distance to consider as duplicate (default: 10)
   * @returns Array of duplicate results sorted by distance (closest first)
   */
  async findDuplicates(
    hash: string,
    threshold = 10,
  ): Promise<DuplicateResult[]> {
    // Fetch all existing phashes from DB
    const existingImages = await this.prisma.$queryRaw<
      { id: string; artwork_id: string; phash: string }[]
    >`SELECT id, artwork_id, phash FROM artwork_images WHERE phash IS NOT NULL`;

    const duplicates: DuplicateResult[] = [];

    for (const img of existingImages) {
      const distance = dist(hash, img.phash);
      if (distance <= threshold) {
        duplicates.push({
          artworkId: img.artwork_id,
          imageId: img.id,
          existingHash: img.phash,
          distance,
        });
      }
    }

    // Sort by distance (closest match first)
    duplicates.sort((a, b) => a.distance - b.distance);

    if (duplicates.length > 0) {
      this.logger.warn(
        `Found ${duplicates.length} duplicate(s) for hash ${hash.substring(0, 16)}...`,
      );
    }

    return duplicates;
  }

  /**
   * Check if image is a near-duplicate and reject upload if so
   * Threshold of 5 = nearly identical images (resize, minor crop, compression)
   * @throws BadRequestException if duplicate found
   */
  async checkAndReject(buffer: Buffer): Promise<string> {
    const hash = await this.generateHash(buffer);
    const duplicates = await this.findDuplicates(hash, 5);

    if (duplicates.length > 0) {
      const closest = duplicates[0];
      this.logger.warn(
        `Duplicate detected! Distance: ${closest.distance}, Artwork: ${closest.artworkId}`,
      );
      throw new BadRequestException({
        message: 'Duplicate image detected. This image has already been uploaded.',
        duplicateArtworkId: closest.artworkId,
        distance: closest.distance,
      });
    }

    return hash;
  }
}
