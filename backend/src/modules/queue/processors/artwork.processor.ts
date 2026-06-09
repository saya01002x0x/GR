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
import { ArtworkStatus, ImageStatus } from '@prisma/client';
import {
  SearchService,
  type ArtworkDocument,
} from '../../search/search.service';
import { DuplicateDetectionService } from '../../duplicate-detection/duplicate-detection.service';
import { EmbeddingService } from '../../ai-search/embedding.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import sharp from 'sharp';

/** Per-image processing result used internally */
interface ImageProcessResult {
  originalUrl?: string;
  url: string;
  thumbnailUrl: string;
  blurredUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  order: number;
  caption?: string;
  phash?: string;
  status: 'PROCESSED' | 'FAILED';
  errorMetadata?: Record<string, any>;
}

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
    private readonly notificationsService: NotificationsService,
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

  /**
   * Get the NSFW threshold from SystemSettings (configurable by Admin).
   * Default: 0.7
   */
  private async getNsfwThreshold(): Promise<number> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'content_moderation' },
      });
      const value = setting?.value as any;
      return value?.nsfwThreshold ?? 0.7;
    } catch {
      return 0.7;
    }
  }

  async process(job: Job<ProcessArtworkJob>): Promise<any> {
    const { artworkId, userId, files } = job.data;
    this.logger.log(
      `Job ${job.id}: Processing artwork ${artworkId} with ${files.length} images`,
    );

    try {
      const nsfwThreshold = await this.getNsfwThreshold();
      this.logger.log(`NSFW threshold: ${nsfwThreshold}`);

      // Step 1: Download & Process Images (with per-image error handling)
      const processedImages: ImageProcessResult[] = [];
      let hasFailures = false;
      let primaryRatioClass = 'square';
      let primaryMaxResolution = 0;
      let primaryIsHighRes = false;

      for (let i = 0; i < files.length; i++) {
        const fileMeta = files[i];

        // Report progress: downloading
        await job.updateProgress({
          phase: 'downloading',
          current: i + 1,
          total: files.length,
          message: `Đang tải ảnh ${i + 1}/${files.length}...`,
          percent: Math.round(((i / files.length) * 20)),
        });

        this.logger.log(`Downloading raw file: ${fileMeta.key}`);
        const rawBuffer = await this.storageService.download(fileMeta.key);

        // --- Phase: Duplicate Detection ---
        await job.updateProgress({
          phase: 'duplicate_check',
          current: i + 1,
          total: files.length,
          message: `Đang kiểm tra trùng lặp ảnh ${i + 1}/${files.length}...`,
          percent: Math.round(20 + ((i / files.length) * 15)),
        });

        let imagePhash: string | undefined;
        let duplicateError: Record<string, any> | null = null;
        try {
          imagePhash = await this.duplicateDetection.checkAndReject(rawBuffer);
          this.logger.log(`Image ${i} phash: ${imagePhash.substring(0, 16)}...`);
        } catch (dupError) {
          if (dupError.response?.message === 'Duplicate image detected. This image has already been uploaded.') {
            this.logger.warn(`Duplicate detected in image ${i} of artwork ${artworkId}`);
            duplicateError = {
              reason: 'DUPLICATE',
              originalArtworkId: dupError.response?.duplicateArtworkId,
              originalImageId: dupError.response?.duplicateImageId,
              distance: dupError.response?.distance,
            };
          } else {
            // pHash generation failed - log and continue without phash
            this.logger.warn(`pHash generation failed for image ${i}, continuing without: ${dupError.message}`);
          }
        }

        // If duplicate detected, mark as failed and continue to next image
        if (duplicateError) {
          hasFailures = true;
          // Still upload a thumbnail so user can see which image failed
          try {
            const thumbnail = await this.storageService.createThumbnail(rawBuffer, 400);
            const thumbPath = this.storageService.generateArtworkPath(userId, artworkId, `thumb_${i}`);
            const thumbUrl = await this.storageService.uploadFile(thumbnail, thumbPath);
            processedImages.push({
              url: thumbUrl,
              thumbnailUrl: thumbUrl,
              blurredUrl: thumbUrl,
              width: 0,
              height: 0,
              aspectRatio: 1,
              order: fileMeta.order,
              caption: fileMeta.caption,
              phash: imagePhash,
              status: 'FAILED',
              errorMetadata: duplicateError,
            });
          } catch {
            processedImages.push({
              url: '',
              thumbnailUrl: '',
              blurredUrl: '',
              width: 0,
              height: 0,
              aspectRatio: 1,
              order: fileMeta.order,
              status: 'FAILED',
              errorMetadata: duplicateError,
            });
          }
          // Cleanup raw file
          await this.storageService.deleteFile(fileMeta.key).catch(() => {});
          continue;
        }

        // --- Phase: NSFW Check ---
        await job.updateProgress({
          phase: 'nsfw_check',
          current: i + 1,
          total: files.length,
          message: `Đang kiểm tra nội dung nhạy cảm ảnh ${i + 1}/${files.length}...`,
          percent: Math.round(35 + ((i / files.length) * 15)),
        });

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

        // NSFW Check
        const predictions = await this.nsfwModel.classify(
          imageTensor as unknown as tf.Tensor3D,
        );
        imageTensor.dispose(); // Cleanup tensor memory immediately

        const nsfwScore =
          predictions.find(
            (p) => p.className === 'Porn' || p.className === 'Hentai',
          )?.probability || 0;

        if (nsfwScore > nsfwThreshold) {
          this.logger.warn(`NSFW detected in image ${i}: score=${nsfwScore}, threshold=${nsfwThreshold}`);
          hasFailures = true;
          // Upload blurred thumbnail for admin/user review
          try {
            const blurred = await this.storageService.createBlurredImage(rawBuffer, 400, 30);
            const blurPath = this.storageService.generateArtworkPath(userId, artworkId, `blur_${i}`);
            const blurUrl = await this.storageService.uploadFile(blurred, blurPath);
            // Also upload unblurred version for admin toggle
            const thumbnail = await this.storageService.createThumbnail(rawBuffer, 400);
            const thumbPath = this.storageService.generateArtworkPath(userId, artworkId, `thumb_${i}`);
            const thumbUrl = await this.storageService.uploadFile(thumbnail, thumbPath);
            processedImages.push({
              url: thumbUrl,
              thumbnailUrl: thumbUrl,
              blurredUrl: blurUrl,
              width: 0,
              height: 0,
              aspectRatio: 1,
              order: fileMeta.order,
              caption: fileMeta.caption,
              phash: imagePhash,
              status: 'FAILED',
              errorMetadata: { reason: 'NSFW', score: nsfwScore, threshold: nsfwThreshold },
            });
          } catch {
            processedImages.push({
              url: '',
              thumbnailUrl: '',
              blurredUrl: '',
              width: 0,
              height: 0,
              aspectRatio: 1,
              order: fileMeta.order,
              status: 'FAILED',
              errorMetadata: { reason: 'NSFW', score: nsfwScore, threshold: nsfwThreshold },
            });
          }
          // Cleanup raw file
          await this.storageService.deleteFile(fileMeta.key).catch(() => {});
          continue;
        }

        // --- Phase: Image Processing (watermark, resize, thumbnail) ---
        await job.updateProgress({
          phase: 'processing',
          current: i + 1,
          total: files.length,
          message: `Đang xử lý ảnh ${i + 1}/${files.length} (thu nhỏ, đóng dấu)...`,
          percent: Math.round(50 + ((i / files.length) * 25)),
        });

        // Calculate ratio/resolution from the primary (first processed) image's raw metadata
        if (processedImages.filter(img => img.status === 'PROCESSED').length === 0) {
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
        const [original, processed, thumbnail, blurred] = await Promise.all([
          this.storageService.processOriginal(imageBuffer),
          this.storageService.processImage(imageBuffer, {
            maxWidth: 1920,
            quality: 85,
          }),
          this.storageService.createThumbnail(imageBuffer, 400),
          this.storageService.createBlurredImage(imageBuffer, 400, 30),
        ]);

        // Generate paths
        const originalPath = this.storageService.generateArtworkPath(
          userId,
          artworkId,
          `original_${i}`,
        );
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
        const [originalUrl, previewUrl, thumbUrl, blurUrl] = await Promise.all([
          this.storageService.uploadFile(original, originalPath),
          this.storageService.uploadFile(processed.buffer, previewPath),
          this.storageService.uploadFile(thumbnail, thumbPath),
          this.storageService.uploadFile(blurred, blurPath),
        ]);

        // Delete Raw File (Cleanup)
        await this.storageService.deleteFile(fileMeta.key);

        processedImages.push({
          originalUrl: originalUrl,
          url: previewUrl,
          thumbnailUrl: thumbUrl,
          blurredUrl: blurUrl,
          width: processed.metadata.width,
          height: processed.metadata.height,
          aspectRatio: processed.metadata.aspectRatio,
          order: fileMeta.order,
          caption: fileMeta.caption,
          phash: imagePhash,
          status: 'PROCESSED',
        });
      }

      // --- Phase: Saving to database ---
      await job.updateProgress({
        phase: 'saving',
        current: files.length,
        total: files.length,
        message: 'Đang lưu dữ liệu vào cơ sở dữ liệu...',
        percent: 80,
      });

      // Determine final artwork status
      const successfulImages = processedImages.filter(img => img.status === 'PROCESSED');
      const failedImages = processedImages.filter(img => img.status === 'FAILED');
      const finalStatus: ArtworkStatus = hasFailures ? 'ACTION_REQUIRED' : 'PUBLISHED';

      // Step 2: Transaction - Update DB
      await this.prisma.$transaction(async (tx) => {
        // Create Image records (both successful and failed ones)
        await tx.artworkImage.createMany({
          data: processedImages.map((img) => ({
            artworkId,
            originalUrl: img.originalUrl || null,
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            blurredUrl: img.blurredUrl,
            width: img.width || null,
            height: img.height || null,
            aspectRatio: img.aspectRatio || null,
            order: img.order,
            phash: img.phash,
            status: img.status as ImageStatus,
            errorMetadata: img.errorMetadata || undefined,
          })),
        });

        await tx.artwork.update({
          where: { id: artworkId },
          data: {
            status: finalStatus,
            ratioClass: primaryRatioClass,
            maxResolution: primaryMaxResolution,
            isHighRes: primaryIsHighRes,
          },
        });
      });

      // Step 3: Index to Meilisearch (only if published successfully)
      if (finalStatus === 'PUBLISHED') {
        try {
          const artwork = await this.prisma.artwork.findUnique({
            where: { id: artworkId },
            include: { author: true, tags: { include: { tag: true } } },
          });

          if (artwork) {
            const firstSuccessful = successfulImages[0];
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
              thumbnail: firstSuccessful?.thumbnailUrl || '',
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
      }

      // Step 4: Generate & store image embeddings (async, non-blocking) - only for successful images
      if (this.embeddingService.isAvailable() && successfulImages.length > 0) {
        this.generateAndStoreEmbeddings(artworkId).catch((err) =>
          this.logger.error(`Embedding generation failed for ${artworkId}: ${err.message}`),
        );
      }

      // Step 5: Notify followers
      if (finalStatus === 'PUBLISHED') {
        this.notifyFollowers(userId, artworkId).catch(err => 
          this.logger.error(`Failed to notify followers for artwork ${artworkId}: ${err.message}`)
        );
      }

      // Final progress update
      await job.updateProgress({
        phase: 'complete',
        current: files.length,
        total: files.length,
        message: hasFailures
          ? `Hoàn tất! ${successfulImages.length} ảnh thành công, ${failedImages.length} ảnh cần xử lý.`
          : `Hoàn tất! ${successfulImages.length} ảnh đã được xuất bản.`,
        percent: 100,
        hasFailures,
        failedCount: failedImages.length,
        successCount: successfulImages.length,
      });

      this.logger.log(
        `Job ${job.id}: Processed artwork ${artworkId} — ${successfulImages.length} OK, ${failedImages.length} failed, status=${finalStatus}`,
      );

      return {
        success: !hasFailures,
        images: processedImages.length,
        failed: failedImages.length,
        status: finalStatus,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Job ${job.id} FAILED: ${errMsg}`, errStack);

      // Update Status to FAILED
      await this.prisma.artwork.update({
        where: { id: artworkId },
        data: { status: 'FAILED' as ArtworkStatus },
      });

      // Report failure via progress
      await job.updateProgress({
        phase: 'error',
        message: `Lỗi hệ thống: ${errMsg}`,
        percent: 100,
      }).catch(() => {});

      throw error;
    }
  }

  /**
   * Async helper to generate and store Gemini embeddings for artwork images
   * Separated from main processing loop so it doesn't block job completion
   */
  private async generateAndStoreEmbeddings(artworkId: string) {
    const images = await this.prisma.artworkImage.findMany({
      where: { artworkId, status: 'PROCESSED' },
      select: { id: true, thumbnailUrl: true }
    });

    for (const img of images) {
      try {
        if (!img.thumbnailUrl) {
          this.logger.warn(`No thumbnail URL found for image ${img.id}, skipping embedding`);
          continue;
        }

        // We just pass the thumbnail URL directly to the embedding service (which runs in a child process)
        // The child process will download the lightweight thumbnail image natively via Transformers.js
        const embedding = await this.embeddingService.getImageEmbedding(img.thumbnailUrl);
        
        // Store embedding manually via raw query since it's pgvector
        const vectorStr = `[${embedding.join(',')}]`;
        await this.prisma.$queryRawUnsafe(
          `UPDATE artwork_images SET embedding = $1::vector, has_embedding = true WHERE id = $2`,
          vectorStr,
          img.id,
        );
        this.logger.debug(`Stored vector embedding for image ${img.id}`);

      } catch (err: any) {
        this.logger.error(`Failed to generate embedding for image ${img.id}: ${err.message}`);
      }
    }
  }

  private async notifyFollowers(artistId: string, artworkId: string) {
    const artist = await this.prisma.user.findUnique({ where: { id: artistId }, select: { displayName: true, username: true } });
    if (!artist) return;

    const artwork = await this.prisma.artwork.findUnique({ where: { id: artworkId }, select: { title: true } });
    if (!artwork) return;

    const followers = await this.prisma.follow.findMany({
      where: { followingId: artistId },
      select: { followerId: true },
    });

    const artistName = artist.displayName || artist.username;

    // We can do this sequentially or in chunks. Sequential is fine for small count.
    for (const { followerId } of followers) {
      const shouldNotify = await this.notificationsService.shouldNotify(followerId, 'newArtworkWeb');
      if (shouldNotify) {
        await this.notificationsService.createNotification(followerId, {
          type: NotificationType.NEW_ARTWORK,
          title: 'New Artwork',
          content: `${artistName} just published "${artwork.title}"`,
          metadata: { artworkId, artistId },
        }).catch(() => {});
      }
    }
  }
}
