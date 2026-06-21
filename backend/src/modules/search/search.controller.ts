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
  constructor(private readonly searchService: SearchService) {}

  @Get('artworks')
  @ApiOperation({ summary: 'Search artworks with filters and pagination' })
  @ApiOkResponse({ description: 'Search results with pagination info' })
  async searchArtworks(@Query() dto: SearchArtworkDto): Promise<SearchResult> {
    let q = dto.q || '';
    let tags = dto.tags || [];

    // Parse #tags from query
    if (q) {
      const words = q.split(/\s+/);
      const extractedTags: string[] = [];
      const remainingWords: string[] = [];

      for (const word of words) {
        if (word.startsWith('#') && word.length > 1) {
          extractedTags.push(word.substring(1));
        } else {
          remainingWords.push(word);
        }
      }

      q = remainingWords.join(' ');
      if (extractedTags.length > 0) {
        tags = Array.isArray(tags) ? [...tags, ...extractedTags] : extractedTags;
      }
    }

    return this.searchService.search(q, {
      tags,
      rating: dto.rating,
      excludeAI: dto.excludeAI,
      sort: dto.sort,
      page: dto.page,
      limit: dto.limit,
      ratio: dto.ratio,
      minRes: dto.minRes,
    });
  }

  @Get('tags/autocomplete')
  @ApiOperation({ summary: 'Autocomplete tags' })
  @ApiOkResponse({ description: 'List of suggested tags' })
  async autocompleteTags(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const q = query || '';
    // Strip # if user types #gi
    const cleanQuery = q.startsWith('#') ? q.substring(1) : q;
    
    if (!cleanQuery) {
      return { message: 'success', data: [] };
    }
    
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const data = await this.searchService.searchTags(cleanQuery, parsedLimit);
    return { message: 'success', data };
  }
}
