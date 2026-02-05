/**
 * Sync Search Script
 * Re-index all artworks from DB to Meilisearch
 * Usage: npx ts-node scripts/sync-search.ts
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
}

async function main() {
    console.log('🔄 Starting Meilisearch sync...');

    const prisma = new PrismaClient();
    const meili = new MeiliSearch({
        host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
        apiKey: process.env.MEILISEARCH_API_KEY || 'masterKey_change_in_production',
    });

    try {
        // Fetch all published artworks
        const artworks = await prisma.artwork.findMany({
            where: { status: 'PUBLISHED' },
            include: {
                author: true,
                tags: { include: { tag: true } },
                images: { orderBy: { order: 'asc' }, take: 1 },
            },
        });

        console.log(`📦 Found ${artworks.length} artworks to index`);

        // Transform to Meilisearch documents
        const documents: ArtworkDocument[] = artworks.map((art) => ({
            id: art.id,
            title: art.title,
            description: art.description || '',
            slug: art.id, // Using ID as slug
            author: {
                id: art.author.id,
                username: art.author.username || '',
                displayName: art.author.displayName || '',
                avatar: art.author.avatar || '',
            },
            thumbnail: art.images[0]?.thumbnailUrl || art.images[0]?.url || '',
            tags: art.tags.map((at) => at.tag.name),
            rating: art.rating || 'SAFE',
            isAI: art.isAI || false,
            createdAt: Math.floor(art.createdAt.getTime() / 1000),
            likeCount: art.likeCount || 0,
            viewCount: art.viewCount || 0,
        }));

        // Index to Meilisearch
        const index = meili.index('artworks');

        // Clear existing documents first (optional)
        await index.deleteAllDocuments();
        console.log('🗑️ Cleared existing documents');

        // Add all documents
        const task = await index.addDocuments(documents);
        console.log(`📤 Indexing task created: ${task.taskUid}`);
        console.log('⏳ Indexing in progress... (async)');

        // Verify stats
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s for indexing
        console.log('✅ All artworks indexed successfully!');

        // Verify
        const stats = await index.getStats();
        console.log(`📊 Index stats: ${stats.numberOfDocuments} documents`);
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
