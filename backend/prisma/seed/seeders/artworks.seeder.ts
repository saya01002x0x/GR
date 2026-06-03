import { PrismaClient, ArtworkType, ArtworkStatus, ContentRating, ArtworkVisibility } from '@prisma/client';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EXTRA_TAGS_MAP } from '../seed-config';
import { processImageVariants, pickRandomElements } from '../seed-utils';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin123',
  },
  endpoint: process.env.AWS_ENDPOINT || 'http://localhost:9000',
  forcePathStyle: true,
});

const BUCKET = process.env.AWS_BUCKET_NAME || 'gr-uploads';

async function objectExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') return false;
    throw error;
  }
}

export async function seedArtworks(prisma: PrismaClient, artistFolderMap: Map<string, string>, tagMap: Map<string, string>, folders: string[]) {
  const imagesBaseDir = path.join(__dirname, '../../seed-data/images');
  const artworks: any[] = [];
  const artworkFolderMap = new Map<string, string>();

  for (const folder of folders) {
    const artistId = artistFolderMap.get(folder);
    if (!artistId) continue;

    const folderPath = path.join(imagesBaseDir, folder);
    const files = await fs.readdir(folderPath);
    files.sort();

    const isCasual = folder.match(/a(06|07|08|09|10)/);
    const maxFiles = isCasual ? 10 : 30;
    const processFiles = files.slice(0, maxFiles);

    // Get tags for this folder
    const theme = folder.replace(/^a\d{2}-/, '');
    const folderTags = [theme, ...(EXTRA_TAGS_MAP[theme] || [])];
    const tagIds = folderTags.map(tag => tagMap.get(tag)).filter(Boolean) as string[];

    let index = 0;
    for (const file of processFiles) {
      index++;
      const filePath = path.join(folderPath, file);
      
      // Determine visibility based on index (Prolific artists: first 20 public, last 10 tier-gated)
      const visibility = (!isCasual && index > 20) ? ArtworkVisibility.TIER_GATED : ArtworkVisibility.PUBLIC;

      // We'll create one artwork per image for simplicity, but you could group them.
      const artworkId = `seed_${folder}_art_${index.toString().padStart(3, '0')}`;
      
      // Check MinIO
      const s3BaseKey = `seed/artworks/${artistId}/${artworkId}`;
      const previewKey = `${s3BaseKey}_preview.jpg`;
      const thumbKey = `${s3BaseKey}_thumb.jpg`;
      const blurKey = `${s3BaseKey}_blur.jpg`;

      const exists = await objectExists(previewKey);
      
      let width = 1000;
      let height = 1000;
      let aspectRatio = 1;
      let ratioClass = 'square';
      let isHighRes = false;
      let maxResolution = 1000;

      if (!exists) {
        console.log(`Uploading ${file} to MinIO...`);
        const buffer = await fs.readFile(filePath);
        const { metadata, buffers } = await processImageVariants(buffer);
        
        width = metadata.width;
        height = metadata.height;
        aspectRatio = metadata.aspectRatio;
        ratioClass = metadata.ratioClass;
        maxResolution = Math.max(width, height);
        isHighRes = maxResolution >= 2560;

        await s3Client.send(new PutObjectCommand({ Bucket: BUCKET, Key: previewKey, Body: buffers.preview, ContentType: 'image/jpeg', ACL: 'public-read' }));
        await s3Client.send(new PutObjectCommand({ Bucket: BUCKET, Key: thumbKey, Body: buffers.thumb, ContentType: 'image/jpeg', ACL: 'public-read' }));
        await s3Client.send(new PutObjectCommand({ Bucket: BUCKET, Key: blurKey, Body: buffers.blur, ContentType: 'image/jpeg', ACL: 'public-read' }));
      } else {
        // Just use defaults if already uploaded to save time in reset, or could use sharp to read metadata again if needed.
        // For deterministic seeds, these defaults are fine if not re-uploading.
      }

      // Create Artwork in DB
      const artworkType = folder === 'a10-manga' ? ArtworkType.MANGA : ArtworkType.ILLUSTRATION;
      const title = `${folder.split('-')[1].charAt(0).toUpperCase() + folder.split('-')[1].slice(1)} Artwork #${index}`;

      const artwork = await prisma.artwork.upsert({
        where: { id: artworkId },
        update: {},
        create: {
          id: artworkId,
          title,
          description: `This is a seeded artwork for ${folder}.`,
          type: artworkType,
          status: ArtworkStatus.PUBLISHED,
          rating: ContentRating.SAFE,
          isAI: false,
          visibility,
          ratioClass,
          maxResolution,
          isHighRes,
          authorId: artistId,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
        }
      });

      // Create Image record
      await prisma.artworkImage.create({
        data: {
          id: `img_${artworkId}`,
          artworkId: artworkId,
          url: `${process.env.AWS_ENDPOINT || 'http://localhost:9000'}/${BUCKET}/${previewKey}`,
          thumbnailUrl: `${process.env.AWS_ENDPOINT || 'http://localhost:9000'}/${BUCKET}/${thumbKey}`,
          blurredUrl: `${process.env.AWS_ENDPOINT || 'http://localhost:9000'}/${BUCKET}/${blurKey}`,
          width,
          height,
          aspectRatio,
          order: 0,
        }
      });

      // Link tags
      for (let i = 0; i < tagIds.length; i++) {
        await prisma.artworkTag.create({
          data: {
            artworkId: artworkId,
            tagId: tagIds[i],
            order: i,
          }
        });
      }

      artworks.push(artwork);
      artworkFolderMap.set(artwork.id, folder);
    }
  }

  return { artworks, artworkFolderMap };
}
