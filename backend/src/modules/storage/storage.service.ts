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
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp');

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

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private readonly s3Client: S3Client;
    private readonly bucket: string;
    private readonly endpoint: string;

    constructor(private readonly configService: ConfigService) {
        this.endpoint = this.configService.get<string>('AWS_ENDPOINT') || 'http://localhost:9000';
        this.bucket = this.configService.get<string>('AWS_BUCKET_NAME') || 'gr-uploads';

        this.s3Client = new S3Client({
            endpoint: this.endpoint,
            region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || 'minioadmin',
                secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || 'minioadmin123',
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
        } catch (error) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                this.logger.log(`Creating bucket "${this.bucket}"...`);
                await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
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
            .withMetadata(false) // Strip EXIF (GPS, camera info)
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
                aspectRatio: (processedMeta.width || width) / (processedMeta.height || height),
                format: 'jpeg',
            },
        };
    }

    /**
     * Create thumbnail
     */
    async createThumbnail(buffer: Buffer, size = 400): Promise<Buffer> {
        return sharp(buffer)
            .rotate()
            .withMetadata(false)
            .resize(size, size, { fit: 'cover' })
            .jpeg({ quality: 70 })
            .toBuffer();
    }

    /**
     * Upload file to MinIO
     */
    async uploadFile(buffer: Buffer, key: string, contentType = 'image/jpeg'): Promise<string> {
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
        return `${this.endpoint}/${this.bucket}/${key}`;
    }

    /**
     * Generate storage path for artwork images
     * Format: artworks/{userId}/{date}/{artworkId}_{variant}.jpg
     */
    generateArtworkPath(
        userId: string,
        artworkId: string,
        variant: 'original' | 'preview' | 'thumb',
    ): string {
        const date = new Date().toISOString().split('T')[0]; // yyyy-mm-dd
        return `artworks/${userId}/${date}/${artworkId}_${variant}.jpg`;
    }
}
