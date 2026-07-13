/**
 * Sync Search Script
 * Re-index all artworks from DB to Meilisearch
 * Also populates ratioClass, maxResolution, isHighRes for existing artworks
 *
 * Usage: npx ts-node scripts/sync-search.ts
 *
 * NOTE on legacy data: If raw files have been deleted, maxResolution will reflect
 * the processed image dimensions (max 1920px). Such artworks will not appear
 * when filtering for "2K" or "4K" unless original raw files are still available.
 */

import { PrismaClient } from '@prisma/client';
import { MeiliSearch } from 'meilisearch';

interface ArtworkDocument {
    id: string;
    title: string;
    description: string;
    slug: string;
    author: {
        id: string;
        username: string;
        displayName: string;
        avatar: string;
    };
    thumbnail: string;
    tags: string[];
    rating: string;
    isAI: boolean;
    createdAt: number;
    likeCount: number;
    viewCount: number;
    ratioClass: string;
    maxResolution: number;
    isHighRes: boolean;
}

function calculateRatioClass(width: number, height: number): string {
    const ar = width / (height || 1);
    if (ar < 0.9) return 'portrait';
    if (ar > 1.1) return 'landscape';
    return 'square';
}

const BATCH_SIZE = 500;

async function main() {
    console.log('🔄 Starting Meilisearch sync + ratio/resolution migration...');

    const prisma = new PrismaClient();
    const meili = new MeiliSearch({
        host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
        apiKey: process.env.MEILISEARCH_API_KEY || 'masterKey_change_in_production',
    });

    try {
        const artworks = await prisma.artwork.findMany({
            where: { status: 'PUBLISHED', requiredTierId: null },
            include: {
                author: true,
                tags: { include: { tag: true } },
                images: { orderBy: { order: 'asc' } },
            },
        });

        console.log(`📦 Found ${artworks.length} artworks to process`);

        const index = meili.index('artworks');
        await index.deleteAllDocuments();
        console.log('🗑️ Cleared existing Meilisearch documents');

        const documents: ArtworkDocument[] = [];
        let updatedCount = 0;

        for (const art of artworks) {
            const primaryImage = art.images[0];
            let ratioClass = art.ratioClass || 'square';
            let maxResolution = art.maxResolution || 0;
            let isHighRes = art.isHighRes || false;

            // Populate ratio/resolution from primary image if not yet calculated
            if (!art.ratioClass && primaryImage) {
                const w = primaryImage.width || 0;
                const h = primaryImage.height || 0;
                ratioClass = calculateRatioClass(w, h);
                maxResolution = Math.max(w, h);
                isHighRes = maxResolution >= 2560;

                await prisma.artwork.update({
                    where: { id: art.id },
                    data: { ratioClass, maxResolution, isHighRes },
                });
                updatedCount++;
            }

            documents.push({
                id: art.id,
                title: art.title,
                description: art.description || '',
                slug: art.id,
                author: {
                    id: art.author.id,
                    username: art.author.username || '',
                    displayName: art.author.displayName || '',
                    avatar: art.author.avatar || '',
                },
                thumbnail: primaryImage?.thumbnailUrl || primaryImage?.url || '',
                tags: art.tags.map((at) => at.tag.name),
                rating: art.rating || 'SAFE',
                isAI: art.isAI || false,
                createdAt: Math.floor(art.createdAt.getTime() / 1000),
                likeCount: art.likeCount || 0,
                viewCount: art.viewCount || 0,
                ratioClass,
                maxResolution,
                isHighRes,
            });

            if (documents.length >= BATCH_SIZE) {
                await index.addDocuments(documents);
                console.log(`📤 Indexed batch of ${documents.length} documents`);
                documents.length = 0;
            }
        }

        if (documents.length > 0) {
            await index.addDocuments(documents);
            console.log(`📤 Indexed final batch of ${documents.length} documents`);
        }

        console.log(`✏️ Updated ${updatedCount} artworks with ratio/resolution data`);

        // Now sync tags
        console.log('📦 Fetching tags to process...');
        const tags = await prisma.tag.findMany();
        console.log(`📦 Found ${tags.length} tags to process`);

        const tagsIndex = meili.index('tags');
        await tagsIndex.deleteAllDocuments();
        console.log('🗑️ Cleared existing tags documents');

        const tagDocuments = tags.map((t) => ({
            id: t.id,
            name: t.name,
            count: t.count,
        }));

        for (let i = 0; i < tagDocuments.length; i += BATCH_SIZE) {
            const batch = tagDocuments.slice(i, i + BATCH_SIZE);
            await tagsIndex.addDocuments(batch);
            console.log(`📤 Indexed batch of ${batch.length} tags`);
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
        const stats = await index.getStats();
        const tagStats = await tagsIndex.getStats();
        console.log(`📊 Index stats: ${stats.numberOfDocuments} artworks, ${tagStats.numberOfDocuments} tags`);
        console.log('✅ Sync complete!');
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
