/**
 * Search Service
 * Handle Meilisearch indexing and search operations
 * Reference: https://www.meilisearch.com/docs
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';
import { RatingFilter, SortOption } from './dto/search-artwork.dto';

export interface ArtworkDocument {
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
    createdAt: number; // Unix timestamp
    likeCount: number;
    viewCount: number;
    ratioClass: string;    // 'portrait' | 'landscape' | 'square'
    maxResolution: number; // max(width, height) in pixels of original image
    isHighRes: boolean;    // true if maxResolution >= 2560 (2K+)
}

export interface SearchResult {
    hits: ArtworkDocument[];
    total: number;
    page: number;
    limit: number;
    processingTimeMs: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
    private readonly logger = new Logger(SearchService.name);
    private client: MeiliSearch;
    private index: Index<ArtworkDocument>;

    private readonly INDEX_NAME = 'artworks';

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('MEILISEARCH_HOST', 'http://localhost:7700');
        const apiKey = this.configService.get<string>('MEILISEARCH_API_KEY', '');

        this.client = new MeiliSearch({ host, apiKey });
        this.index = this.client.index<ArtworkDocument>(this.INDEX_NAME);
    }

    async onModuleInit() {
        this.logger.log('🔍 Initializing Meilisearch...');

        try {
            // Check health
            const health = await this.client.health();
            this.logger.log(`✅ Meilisearch is healthy: ${health.status}`);

            // Create or update index with settings
            await this.ensureIndexSettings();
            this.logger.log(`✅ Index "${this.INDEX_NAME}" ready`);
        } catch (error) {
            this.logger.error('❌ Failed to initialize Meilisearch', error);
        }
    }

    /**
     * Ensure index exists with proper settings
     */
    private async ensureIndexSettings() {
        // Create index if not exists
        await this.client.createIndex(this.INDEX_NAME, { primaryKey: 'id' }).catch(() => {
            // Index already exists, ignore error
        });

        // Update settings
        await this.index.updateSettings({
            searchableAttributes: ['title', 'tags', 'author.displayName', 'description'],
            filterableAttributes: ['tags', 'rating', 'isAI', 'author.id', 'ratioClass', 'maxResolution', 'isHighRes'],
            sortableAttributes: ['createdAt', 'likeCount', 'viewCount'],
            rankingRules: [
                'words',
                'typo',
                'proximity',
                'attribute',
                'sort',
                'exactness',
                'likeCount:desc',
                'viewCount:desc',
            ],
            typoTolerance: {
                enabled: true,
            },
        });
    }

    /**
     * Index a single artwork
     */
    async indexArtwork(artwork: ArtworkDocument): Promise<void> {
        try {
            await this.index.addDocuments([artwork]);
            this.logger.debug(`Indexed artwork: ${artwork.id}`);
        } catch (error) {
            this.logger.error(`Failed to index artwork ${artwork.id}`, error);
            throw error;
        }
    }

    /**
     * Remove artwork from index
     */
    async removeArtwork(id: string): Promise<void> {
        try {
            await this.index.deleteDocument(id);
            this.logger.debug(`Removed artwork from index: ${id}`);
        } catch (error) {
            this.logger.error(`Failed to remove artwork ${id}`, error);
        }
    }

    /**
     * Search artworks with filters and pagination
     */
    async search(
        query: string = '',
        options: {
            tags?: string[];
            rating?: RatingFilter;
            excludeAI?: boolean;
            sort?: SortOption;
            page?: number;
            limit?: number;
            ratio?: string;
            minRes?: string;
        } = {},
    ): Promise<SearchResult> {
        const { tags, rating, excludeAI, sort, page = 1, limit = 20, ratio, minRes } = options;

        // Build filter string
        const filters: string[] = [];

        if (Array.isArray(tags) && tags.length > 0) {
            // AND logic: all tags must match
            const tagFilters = tags.map((tag) => `tags = "${tag}"`);
            filters.push(`(${tagFilters.join(' AND ')})`);
        }

        if (rating && rating !== RatingFilter.ALL) {
            filters.push(`rating = "${rating}"`);
        }

        if (excludeAI === true) {
            filters.push('isAI = false');
        }

        if (ratio) {
            filters.push(`ratioClass = "${ratio}"`);
        }

        if (minRes) {
            const thresholds: Record<string, number> = { hd: 1280, full_hd: 1920, '2k': 2560, '4k': 3840 };
            const minPixels = thresholds[minRes] || 0;
            if (minPixels > 0) {
                filters.push(`maxResolution >= ${minPixels}`);
            }
        }

        // Build sort
        let sortArr: string[] = [];
        if (sort === SortOption.NEWEST) {
            sortArr = ['createdAt:desc'];
        } else if (sort === SortOption.POPULAR) {
            sortArr = ['likeCount:desc', 'viewCount:desc'];
        }

        // Execute search
        const result = await this.index.search(query, {
            filter: filters.length > 0 ? filters.join(' AND ') : undefined,
            sort: sortArr.length > 0 ? sortArr : undefined,
            limit,
            offset: (page - 1) * limit,
        });

        return {
            hits: result.hits as ArtworkDocument[],
            total: result.estimatedTotalHits || 0,
            page,
            limit,
            processingTimeMs: result.processingTimeMs,
        };
    }

    /**
     * Partial update documents in Meilisearch
     * Only updates the fields provided (e.g., stats counters)
     * Used by MeilisearchSyncService for batched stats updates
     */
    async updatePartialDocuments(
        updates: Record<string, any>[],
    ): Promise<void> {
        if (updates.length === 0) return;

        try {
            await this.index.updateDocuments(updates);
            this.logger.debug(`Partial updated ${updates.length} documents`);
        } catch (error) {
            this.logger.error('Failed to partial update documents', error);
            throw error;
        }
    }

    /**
     * Bulk index artworks (for re-indexing)
     */
    async bulkIndex(artworks: ArtworkDocument[]): Promise<void> {
        if (artworks.length === 0) return;

        try {
            await this.index.addDocuments(artworks);
            this.logger.log(`Bulk indexed ${artworks.length} artworks`);
        } catch (error) {
            this.logger.error('Failed to bulk index artworks', error);
            throw error;
        }
    }
}
