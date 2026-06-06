import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env } from '@xenova/transformers';

type EmbeddingCacheEntry = {
  artworkId?: string;
  imageUrl?: string;
  embedding?: number[];
  updatedAt?: string;
};

type EmbeddingCache = Record<string, EmbeddingCacheEntry>;

const CACHE_PATH = path.join(__dirname, '../seed-data/embeddings-cache.json');
const MODEL_ID = 'Xenova/clip-vit-base-patch32';
const EMBEDDING_DIMENSION = 512;

async function readCache(): Promise<EmbeddingCache> {
  try {
    const cacheData = await fs.readFile(CACHE_PATH, 'utf-8');
    return JSON.parse(cacheData);
  } catch {
    return {};
  }
}

async function writeCache(cache: EmbeddingCache) {
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function ensureEmbeddingColumnDimension(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE artwork_images ALTER COLUMN embedding TYPE vector(${EMBEDDING_DIMENSION})`,
  );
}

async function main() {
  const prisma = new PrismaClient();
  const cache = await readCache();
  let cacheUpdated = false;
  let processor: any = null;
  let visionModel: any = null;

  const getImageEmbedding = async (buffer: Buffer): Promise<number[]> => {
    if (!processor || !visionModel) {
      console.log(`Loading CLIP model (${MODEL_ID}) on CPU...`);
      env.allowLocalModels = true;
      processor = await AutoProcessor.from_pretrained(MODEL_ID);
      visionModel = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID);
    }

    const blob = new Blob([new Uint8Array(buffer)]);
    const rawImage = await RawImage.fromBlob(blob);
    const imageInputs = await processor(rawImage);
    const output = await visionModel(imageInputs);
    return Array.from(output.image_embeds.data) as number[];
  };

  try {
    await ensureEmbeddingColumnDimension(prisma);

    const images = await prisma.artworkImage.findMany({
      where: { hasEmbedding: false },
      select: {
        id: true,
        url: true,
        artworkId: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (images.length === 0) {
      console.log('No artwork images need AI embeddings.');
      return;
    }

    console.log(`Generating AI embeddings for ${images.length} artwork images...`);

    for (const image of images) {
      let embedding = cache[image.id]?.embedding;

      if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
        console.log(`Embedding ${image.id}...`);
        const imageBuffer = await fetchImageBuffer(image.url);
        embedding = await getImageEmbedding(imageBuffer);

        cache[image.id] = {
          ...cache[image.id],
          artworkId: image.artworkId,
          imageUrl: image.url,
          embedding,
          updatedAt: new Date().toISOString(),
        };
        cacheUpdated = true;
      } else {
        console.log(`Using cached embedding for ${image.id}.`);
      }

      const vectorStr = `[${embedding.join(',')}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE artwork_images SET embedding = $1::vector, has_embedding = true WHERE id = $2`,
        vectorStr,
        image.id,
      );
    }

    if (cacheUpdated) {
      await writeCache(cache);
      console.log(`Saved embeddings cache to ${CACHE_PATH}`);
    }

    console.log('AI seed completed.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error('Error during AI seed:', error);
  process.exit(1);
});
