/**
 * Search Controller
 * API endpoints for artwork search
 * Reference: https://docs.nestjs.com/controllers
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { SearchService, SearchResult } from './search.service';
import { SearchArtworkDto } from './dto/search-artwork.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get('artworks')
    @ApiOperation({ summary: 'Search artworks with filters and pagination' })
    @ApiOkResponse({ description: 'Search results with pagination info' })
    async searchArtworks(@Query() dto: SearchArtworkDto): Promise<SearchResult> {
        return this.searchService.search(dto.q, {
            tags: dto.tags,
            rating: dto.rating,
            excludeAI: dto.excludeAI,
            sort: dto.sort,
            page: dto.page,
            limit: dto.limit,
        });
    }
}
