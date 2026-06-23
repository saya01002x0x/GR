/**
 * Storage Service
 * Handle file uploads to MinIO with Sharp image processing
 * Reference: https://docs.nestjs.com/providers
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import * as path from 'path';
import * as fs from 'fs';

import sharp from 'sharp';

export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  format: string;
}

export interface ProcessedImage {
  buffer: Buffer;
  metadata: ImageMetadata;
}

export interface UploadResult {
  key: string;
  url: string;
  metadata: ImageMetadata;
}

export interface WatermarkOptions {
  position: string;
  opacity: number; // 10-100
  size: number; // % of image width
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint =
      this.configService.get<string>('AWS_ENDPOINT') || 'http://localhost:9000';
    this.bucket =
      this.configService.get<string>('AWS_BUCKET_NAME') || 'gr-uploads';

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId:
          this.configService.get<string>('AWS_ACCESS_KEY_ID') || 'minioadmin',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ||
          'minioadmin123',
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  /**
   * Ensure bucket exists, create if not
   */
  private async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" exists`);
    } catch (err: unknown) {
      const error = err as Error & { $metadata?: { httpStatusCode?: number } };
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        this.logger.log(`Creating bucket "${this.bucket}"...`);
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucket }),
        );
        this.logger.log(`Bucket "${this.bucket}" created`);
      } else {
        this.logger.warn(`Could not check bucket: ${error.message}`);
      }
    }
  }

  /**
   * Process image with Sharp
   * - Auto-rotate based on EXIF
   * - Strip metadata (GPS, camera info)
   * - Resize and compress
   */
  async processImage(
    buffer: Buffer,
    options: { maxWidth?: number; quality?: number } = {},
  ): Promise<ProcessedImage> {
    const { maxWidth = 1200, quality = 80 } = options;

    // Get metadata first
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Process image
    const processed = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      // omitted .withMetadata() to strip EXIF (GPS, camera info)
      .resize(maxWidth, undefined, { withoutEnlargement: true })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    // Get processed metadata
    const processedMeta = await sharp(processed).metadata();

    return {
      buffer: processed,
      metadata: {
        width: processedMeta.width || width,
        height: processedMeta.height || height,
        aspectRatio:
          (processedMeta.width || width) / (processedMeta.height || height),
        format: 'jpeg',
      },
    };
  }

  /**
   * Process original image
   * - Auto-rotate based on EXIF
   * - Strip EXIF (GPS, camera info)
   * - Keep original size
   */
  async processOriginal(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      // omitted .withMetadata() to strip EXIF
      .jpeg({ quality: 100, progressive: true })
      .toBuffer();
  }

  /**
   * Create thumbnail
   */
  async createThumbnail(buffer: Buffer, size = 400): Promise<Buffer> {
    return await sharp(buffer)
      .rotate()
      // omitted .withMetadata() to strip EXIF
      .resize(size, size, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();
  }

  /**
   * Create blurred preview image for tier-gated content
   * Heavy blur makes content unrecognizable while preserving colors/composition
   */
  async createBlurredImage(
    buffer: Buffer,
    size = 400,
    blurRadius = 30,
  ): Promise<Buffer> {
    return await sharp(buffer)
      .rotate()
      // omitted .withMetadata() to strip EXIF
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .blur(blurRadius)
      .jpeg({ quality: 50, progressive: true })
      .toBuffer();
  }



  /**
   * Upload file to MinIO
   */
  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType = 'image/jpeg',
  ): Promise<string> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
      }),
    );

    return this.getPublicUrl(key);
  }

  /**
   * Upload RAW file (for background processing)
   */
  async uploadRaw(buffer: Buffer, key: string): Promise<void> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        // Binary stream
        ContentType: 'application/octet-stream',
      }),
    );
  }

  /**
   * Download file as Buffer
   */
  async download(key: string): Promise<Buffer> {
    // Implement download logic here using GetObjectCommand
    // For simplicity, we can fetch from public URL if it's public
    // But for RAW files, we should use S3 SDK
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');

    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    // Convert stream to buffer
    const byteArray = await response.Body?.transformToByteArray();
    if (!byteArray) {
      throw new Error(`Failed to download file: ${key}`);
    }
    return Buffer.from(byteArray);
  }

  /**
   * Delete file from MinIO
   */
  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    const publicEndpoint = this.configService.get<string>('AWS_PUBLIC_ENDPOINT') || this.endpoint;
    // Xóa dấu / ở cuối nếu có
    const cleanEndpoint = publicEndpoint.replace(/\/$/, '');
    return `${cleanEndpoint}/${this.bucket}/${key}`;
  }

  /**
   * Generate storage path for artwork images
   * Format: artworks/{userId}/{date}/{artworkId}_{variant}.jpg
   * Variant can be: original, preview, thumb, preview_0, thumb_0, etc.
   */
  generateArtworkPath(
    userId: string,
    artworkId: string,
    variant: string,
  ): string {
    const date = new Date().toISOString().split('T')[0]; // yyyy-mm-dd
    return `artworks/${userId}/${date}/${artworkId}_${variant}.jpg`;
  }

  private readonly WATERMARK_PADDING = 20;

  /**
   * Resolve watermark file path for both dev and production.
   * Compiled output is at dist/src/modules/storage/ (__dirname),
   * so assets at dist/assets/ are 3 levels up (../../../assets/).
   * Falls back to src/ for safety.
   */
  private resolveWatermarkPath(filename: string): string {
    const assetRelPath = path.join('assets', 'watermarks', filename);
    const candidates = [
      path.join(__dirname, '..', '..', '..', assetRelPath), // dist/src/modules/storage -> dist/assets/
      path.join(process.cwd(), 'dist', assetRelPath), // from backend root
      path.join(process.cwd(), 'src', assetRelPath), // dev fallback (src/)
    ];
    const found = candidates.find((p) => fs.existsSync(p));
    if (!found) {
      throw new Error(
        `Watermark file not found: ${filename}. Tried:\n  ${candidates.join('\n  ')}`,
      );
    }
    this.logger.debug(`Watermark resolved: ${found}`);
    return found;
  }

  async applyWatermark(
    imageBuffer: Buffer,
    options: WatermarkOptions,
  ): Promise<Buffer> {
    const imgMeta = await sharp(imageBuffer).metadata();
    const imgWidth = imgMeta.width || 1200;
    const imgHeight = imgMeta.height || 800;

    const watermarkPath = this.resolveWatermarkPath('icon_daonhai_GR.png');
    const wmTargetWidth = Math.round(imgWidth * (options.size / 100));

    const resizedWm = await sharp(watermarkPath)
      .resize(wmTargetWidth)
      .ensureAlpha()
      .toBuffer();

    const wmMeta = await sharp(resizedWm).metadata();
    const wmWidth = wmMeta.width;
    const wmHeight = wmMeta.height;

    // Multiply alpha channel by opacity factor for correct transparency
    const { data, info } = await sharp(resizedWm)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels as number; // 4 (RGBA)
    const alphaMultiplier = options.opacity / 100;
    for (let i = 0; i < data.length; i += channels) {
      data[i + 3] = Math.round(data[i + 3] * alphaMultiplier);
    }

    const adjustedWm = await sharp(data, {
      raw: { width: wmWidth, height: wmHeight, channels: 4 },
    })
      .png()
      .toBuffer();

    const { left, top } = this.calculateWatermarkPosition(
      options.position,
      imgWidth,
      imgHeight,
      wmWidth,
      wmHeight,
      this.WATERMARK_PADDING,
    );

    return sharp(imageBuffer)
      .composite([{ input: adjustedWm, left, top, blend: 'over' }])
      .toBuffer();
  }

  private calculateWatermarkPosition(
    position: string,
    imgWidth: number,
    imgHeight: number,
    wmWidth: number,
    wmHeight: number,
    padding: number,
  ): { left: number; top: number } {
    const positions: Record<string, { left: number; top: number }> = {
      'top-left': { left: padding, top: padding },
      'top-center': {
        left: Math.round((imgWidth - wmWidth) / 2),
        top: padding,
      },
      'top-right': { left: imgWidth - wmWidth - padding, top: padding },
      'middle-left': {
        left: padding,
        top: Math.round((imgHeight - wmHeight) / 2),
      },
      center: {
        left: Math.round((imgWidth - wmWidth) / 2),
        top: Math.round((imgHeight - wmHeight) / 2),
      },
      'middle-right': {
        left: imgWidth - wmWidth - padding,
        top: Math.round((imgHeight - wmHeight) / 2),
      },
      'bottom-left': { left: padding, top: imgHeight - wmHeight - padding },
      'bottom-center': {
        left: Math.round((imgWidth - wmWidth) / 2),
        top: imgHeight - wmHeight - padding,
      },
      'bottom-right': {
        left: imgWidth - wmWidth - padding,
        top: imgHeight - wmHeight - padding,
      },
    };
    const pos = positions[position] || positions['bottom-right'];
    return {
      left: Math.max(0, pos.left),
      top: Math.max(0, pos.top),
    };
  }
}
