import { Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAME, JOB_PROCESS_IMAGES, ProcessArtworkJob, AI_TAGGING_CONCURRENCY } from '../queue.constants';
import * as nsfwjs from 'nsfwjs';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import { ArtworkStatus } from '@prisma/client';
import { SearchService, ArtworkDocument } from '../../search/search.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp');

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
        this.logger.log(`Job ${job.id}: Processing artwork ${artworkId} with ${files.length} images`);

        try {
            // Step 1: Download & Process Images
            const processedImages: {
                url: string;
                thumbnailUrl: string;
                width: number;
                height: number;
                aspectRatio: number;
                order: number;
                caption?: string;
            }[] = [];
            let isNSFW = false;
            let primaryRatioClass = 'square';
            let primaryMaxResolution = 0;
            let primaryIsHighRes = false;

            for (let i = 0; i < files.length; i++) {
                const fileMeta = files[i];
                this.logger.log(`Downloading raw file: ${fileMeta.key}`);

                const rawBuffer = await this.storageService.download(fileMeta.key);

                // Decode image for AI check using Sharp (since tf.node.decodeImage is missing)
                const { data, info } = await sharp(rawBuffer)
                    .resize(224, 224) // nsfwjs usually works on 224x224
                    .removeAlpha() // Remove alpha channel (RGBA -> RGB) to prevent tensor shape mismatch
                    .raw()
                    .toBuffer({ resolveWithObject: true });

                const imageTensor = tf.tensor3d(
                    new Uint8Array(data),
                    [info.height, info.width, 3],
                    'int32'
                );

                // NSFW Check (Phase 1)
                const predictions = await this.nsfwModel.classify(imageTensor as any);
                imageTensor.dispose(); // Cleanup tensor memory immediately

                const nsfwScore = predictions.find(p => p.className === 'Porn' || p.className === 'Hentai')?.probability || 0;
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
                    this.logger.log(`Applying watermark to image ${i} (position: ${fileMeta.watermark.position}, opacity: ${fileMeta.watermark.opacity}%, size: ${fileMeta.watermark.size}%)`);
                    imageBuffer = await this.storageService.applyWatermark(rawBuffer, {
                        position: fileMeta.watermark.position,
                        opacity: fileMeta.watermark.opacity,
                        size: fileMeta.watermark.size,
                    });
                }

                // Sharp Processing
                const [processed, thumbnail] = await Promise.all([
                    this.storageService.processImage(imageBuffer, { maxWidth: 1920, quality: 85 }),
                    this.storageService.createThumbnail(imageBuffer, 400),
                ]);

                // Generate paths
                const previewPath = this.storageService.generateArtworkPath(userId, artworkId, `preview_${i}`);
                const thumbPath = this.storageService.generateArtworkPath(userId, artworkId, `thumb_${i}`);

                // Upload Optimized
                const [previewUrl, thumbUrl] = await Promise.all([
                    this.storageService.uploadFile(processed.buffer, previewPath),
                    this.storageService.uploadFile(thumbnail, thumbPath),
                ]);

                // Delete Raw File (Cleanup)
                await this.storageService.deleteFile(fileMeta.key);

                processedImages.push({
                    url: previewUrl,
                    thumbnailUrl: thumbUrl,
                    width: processed.metadata.width,
                    height: processed.metadata.height,
                    aspectRatio: processed.metadata.aspectRatio,
                    order: fileMeta.order,
                    caption: fileMeta.caption,
                });
            }

            // Step 2: Transaction - Update DB
            await this.prisma.$transaction(async (tx) => {
                // Create Image records
                await tx.artworkImage.createMany({
                    data: processedImages.map(img => ({
                        artworkId,
                        url: img.url,
                        thumbnailUrl: img.thumbnailUrl,
                        width: img.width,
                        height: img.height,
                        aspectRatio: img.aspectRatio,
                        order: img.order,
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
                        tags: artwork.tags.map(at => at.tag.name),
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

            this.logger.log(`Job ${job.id}: Successfully processed artwork ${artworkId}`);
            return { success: true, images: processedImages.length, nsfw: isNSFW };

        } catch (error) {
            this.logger.error(`Job ${job.id} FAILED: ${error.message}`, error.stack);

            // Update Status to FAILED
            await this.prisma.artwork.update({
                where: { id: artworkId },
                data: { status: 'FAILED' as ArtworkStatus }, // Requires FAILED in Prisma enum
            });

            throw error; // Let BullMQ handle retry
        }
    }
}
