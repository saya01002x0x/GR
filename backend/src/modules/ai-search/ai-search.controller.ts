/**
 * AI Search Controller
 * Endpoints for semantic text search and sketch search
 */

import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AiSearchService } from './ai-search.service';
import { ClerkGuard } from '../auth/clerk.guard';

@Controller('ai-search')
export class AiSearchController {
  constructor(private readonly aiSearchService: AiSearchService) {}

  /**
   * GET /ai-search/text?q=girl+with+red+hair&limit=20
   * Public endpoint - semantic text search
   */
  @Get('text')
  async searchByText(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    if (!query || query.trim().length === 0) {
      return { results: [], total: 0 };
    }

    const userId = req?.auth?.userId;
    const ip = req?.ip || req?.socket?.remoteAddress || 'unknown';

    const results = await this.aiSearchService.searchByText(
      query,
      limit ? parseInt(limit, 10) : 20,
      userId,
      ip,
    );

    return {
      results,
      total: results.length,
    };
  }

  /**
   * POST /ai-search/sketch
   * Premium endpoint - sketch-based image search
   * Body: { image: string (base64), limit?: number }
   */
  @Post('sketch')
  @UseGuards(ClerkGuard)
  async searchBySketch(
    @Body() body: { image: string; limit?: number },
    @Request() req: any,
  ) {
    const userId = req.auth?.userId;
    if (!userId) {
      return { results: [], total: 0 };
    }

    const results = await this.aiSearchService.searchBySketch(
      userId,
      body.image,
      body.limit || 10,
    );

    return {
      results,
      total: results.length,
    };
  }
}
