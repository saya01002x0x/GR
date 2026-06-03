import { Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import {
  QUEUE_NAME,
  ProcessArtworkJob,
  AI_TAGGING_CONCURRENCY,
} from '../queue.constants';
import * as nsfwjs from 'nsfwjs';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import { ArtworkStatus } from '@prisma/client';
import {
  SearchService,
  type ArtworkDocument,
} from '../../search/search.service';
import { DuplicateDetectionService } from '../../duplicate-detection/duplicate-detection.service';
import { EmbeddingService } from '../../ai-search/embedding.service';
import sharp from 'sharp';

@Processor(QUEUE_NAME, {
  concurrency: AI_TAGGING_CONCURRENCY, // Limit to 1 job to save RAM
})
export class ArtworkProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(ArtworkProcessor.name);
  private nsfwModel: nsfwjs.NSFWJS;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly searchService: SearchService,
    private readonly duplicateDetection: DuplicateDetectionService,
    private readonly embeddingService: EmbeddingService,
  ) {
    super();
  }

  async onModuleInit() {
    // Load AI model ONCE at startup
    this.logger.log('🧠 Loading NSFWJS model...');
    try {
      // Use CPU backend for stability in Node.js
      await tf.setBackend('cpu');
      await tf.ready();
      this.nsfwModel = await nsfwjs.load();
      this.logger.log('🧠 NSFWJS Model loaded successfully!');
    } catch (error) {
      this.logger.error('Failed to load AI model', error);
    }
  }

  async process(job: Job<ProcessArtworkJob>): Promise<any> {
    const { artworkId, userId, files } = job.data;
    this.logger.log(
      `Job ${job.id}: Processing artwork ${artworkId} with ${files.length} images`,
    );

    try {
      // Step 1: Download & Process Images
      const processedImages: {
        url: string;
        thumbnailUrl: string;
        blurredUrl: string;
        width: number;
        height: number;
        aspectRatio: number;
        order: number;
        caption?: string;
        phash?: string;
      }[] = [];
      let isNSFW = false;
      let primaryRatioClass = 'square';
      let primaryMaxResolution = 0;
      let primaryIsHighRes = false;

      for (let i = 0; i < files.length; i++) {
        const fileMeta = files[i];
        this.logger.log(`Downloading raw file: ${fileMeta.key}`);

        const rawBuffer = await this.storageService.download(fileMeta.key);

        // Duplicate Detection: Generate pHash and check for duplicates
        let imagePhash: string | undefined;
        try {
          imagePhash = await this.duplicateDetection.checkAndReject(rawBuffer);
          this.logger.log(`Image ${i} phash: ${imagePhash.substring(0, 16)}...`);
        } catch (dupError) {
          if (dupError.response?.message === 'Duplicate image detected. This image has already been uploaded.') {
            this.logger.warn(`Skipping duplicate image ${i} in artwork ${artworkId}`);
            // For multi-image artworks, skip the duplicate image instead of failing entire job
            // For single image artworks, this will still throw
            if (files.length === 1) throw dupError;
            continue;
          }
          // Other errors - just log and continue without phash
          this.logger.warn(`pHash generation failed for image ${i}, continuing without: ${dupError.message}`);
        }

        // Decode image for AI check using Sharp
        const { data, info } = await sharp(rawBuffer)
          .resize(224, 224) // nsfwjs usually works on 224x224
          .removeAlpha() // Remove alpha channel (RGBA -> RGB) to prevent tensor shape mismatch
          .raw()
          .toBuffer({ resolveWithObject: true });

        const imageTensor = tf.tensor3d(
          new Uint8Array(data),
          [info.height, info.width, 3],
          'int32',
        );

        // NSFW Check (Phase 1)
        const predictions = await this.nsfwModel.classify(
          imageTensor as unknown as tf.Tensor3D,
        );
        imageTensor.dispose(); // Cleanup tensor memory immediately

        const nsfwScore =
          predictions.find(
            (p) => p.className === 'Porn' || p.className === 'Hentai',
          )?.probability || 0;
        if (nsfwScore > 0.6) {
          isNSFW = true;
          this.logger.warn(`NSFW detected in image ${i}: ${nsfwScore}`);
        }

        // Calculate ratio/resolution from the primary (first) image's raw metadata
        if (i === 0) {
          const rawMeta = await sharp(rawBuffer).metadata();
          const origW = rawMeta.width || 0;
          const origH = rawMeta.height || 0;
          primaryMaxResolution = Math.max(origW, origH);
          primaryIsHighRes = primaryMaxResolution >= 2560;

          const ar = origW / (origH || 1);
          if (ar < 0.9) primaryRatioClass = 'portrait';
          else if (ar > 1.1) primaryRatioClass = 'landscape';
          else primaryRatioClass = 'square';
        }

        let imageBuffer = rawBuffer;
        if (fileMeta.watermark?.enabled) {
          this.logger.log(
            `Applying watermark to image ${i} (position: ${fileMeta.watermark.position}, opacity: ${fileMeta.watermark.opacity}%, size: ${fileMeta.watermark.size}%)`,
          );
          imageBuffer = await this.storageService.applyWatermark(rawBuffer, {
            position: fileMeta.watermark.position,
            opacity: fileMeta.watermark.opacity,
            size: fileMeta.watermark.size,
          });
        }

        // Sharp Processing
        const [processed, thumbnail, blurred] = await Promise.all([
          this.storageService.processImage(imageBuffer, {
            maxWidth: 1920,
            quality: 85,
          }),
          this.storageService.createThumbnail(imageBuffer, 400),
          this.storageService.createBlurredImage(imageBuffer, 400, 30),
        ]);

        // Generate paths
        const previewPath = this.storageService.generateArtworkPath(
          userId,
          artworkId,
          `preview_${i}`,
        );
        const thumbPath = this.storageService.generateArtworkPath(
          userId,
          artworkId,
          `thumb_${i}`,
        );
        const blurPath = this.storageService.generateArtworkPath(
          userId,
          artworkId,
          `blur_${i}`,
        );

        // Upload Optimized
        const [previewUrl, thumbUrl, blurUrl] = await Promise.all([
          this.storageService.uploadFile(processed.buffer, previewPath),
          this.storageService.uploadFile(thumbnail, thumbPath),
          this.storageService.uploadFile(blurred, blurPath),
        ]);

        // Delete Raw File (Cleanup)
        await this.storageService.deleteFile(fileMeta.key);

        processedImages.push({
          url: previewUrl,
          thumbnailUrl: thumbUrl,
          blurredUrl: blurUrl,
          width: processed.metadata.width,
          height: processed.metadata.height,
          aspectRatio: processed.metadata.aspectRatio,
          order: fileMeta.order,
          caption: fileMeta.caption,
          phash: imagePhash,
        });
      }

      // Step 2: Transaction - Update DB
      await this.prisma.$transaction(async (tx) => {
        // Create Image records
        await tx.artworkImage.createMany({
          data: processedImages.map((img) => ({
            artworkId,
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            blurredUrl: img.blurredUrl,
            width: img.width,
            height: img.height,
            aspectRatio: img.aspectRatio,
            order: img.order,
            phash: img.phash,
          })),
        });

        await tx.artwork.update({
          where: { id: artworkId },
          data: {
            status: 'PUBLISHED' as ArtworkStatus,
            rating: isNSFW ? 'R18' : undefined,
            ratioClass: primaryRatioClass,
            maxResolution: primaryMaxResolution,
            isHighRes: primaryIsHighRes,
          },
        });
      });

      // Step 3: Index to Meilisearch (after DB transaction success)
      try {
        const artwork = await this.prisma.artwork.findUnique({
          where: { id: artworkId },
          include: { author: true, tags: { include: { tag: true } } },
        });

        if (artwork) {
          const document: ArtworkDocument = {
            id: artwork.id,
            title: artwork.title,
            description: artwork.description || '',
            slug: artwork.id,
            author: {
              id: artwork.author.id,
              username: artwork.author.username || '',
              displayName: artwork.author.displayName || '',
              avatar: artwork.author.avatar || '',
            },
            thumbnail: processedImages[0]?.thumbnailUrl || '',
            tags: artwork.tags.map((at) => at.tag.name),
            rating: artwork.rating || 'SAFE',
            isAI: artwork.isAI || false,
            createdAt: Math.floor(artwork.createdAt.getTime() / 1000),
            likeCount: artwork.likeCount || 0,
            viewCount: artwork.viewCount || 0,
            ratioClass: primaryRatioClass,
            maxResolution: primaryMaxResolution,
            isHighRes: primaryIsHighRes,
          };
          await this.searchService.indexArtwork(document);
          this.logger.log(`Job ${job.id}: Indexed artwork to Meilisearch`);
        }
      } catch (meiliError) {
        this.logger.error(
          `Meilisearch index failed for ${artworkId}, DB is updated. Run sync-search to fix.`,
          meiliError,
        );
      }

      this.logger.log(
        `Job ${job.id}: Successfully processed artwork ${artworkId}`,
      );

      // Step 4: Generate & store image embeddings (async, non-blocking)
      if (this.embeddingService.isAvailable()) {
        this.generateAndStoreEmbeddings(artworkId).catch((err) =>
          this.logger.error(`Embedding generation failed for ${artworkId}: ${err.message}`),
        );
      }

      return { success: true, images: processedImages.length, nsfw: isNSFW };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Job ${job.id} FAILED: ${errMsg}`, errStack);

      // Update Status to FAILED
      await this.prisma.artwork.update({
        where: { id: artworkId },
        data: { status: 'FAILED' as ArtworkStatus },
      });

      throw error;
    }
  }

  /**
   * Async helper to generate and store Gemini embeddings for artwork images
   * Separated from main processing loop so it doesn't block job completion
   */
  private async generateAndStoreEmbeddings(artworkId: string) {
    const images = await this.prisma.artworkImage.findMany({
      where: { artworkId },
      select: { id: true, url: true }
    });

    for (const img of images) {
      try {
        // We use the image URL to get a public stream/buffer, or fetch from storage
        const objectKey = new URL(img.url).pathname.slice(1); // naive way to get key from s3 url
        const rawBuffer = await this.storageService.download(objectKey);
        const base64Data = rawBuffer.toString('base64');
        
        const embedding = await this.embeddingService.getImageEmbedding(base64Data);
        
        // Store embedding manually via raw query since it's pgvector
        const vectorStr = `[${embedding.join(',')}]`;
        await this.prisma.$queryRawUnsafe(
          `UPDATE artwork_images SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          img.id,
        );
        this.logger.debug(`Stored vector embedding for image ${img.id}`);
      } catch (err) {
        this.logger.error(`Failed to generate embedding for image ${img.id}: ${err.message}`);
      }
    }
  }
}
