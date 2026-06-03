/**
 * Recommendations Controller
 * Endpoints for artwork and user recommendations
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { ClerkGuard } from '../auth/clerk.guard';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  /**
   * GET /recommendations/artwork/:id?limit=10
   * Get "Users who liked this also liked..." recommendations
   */
  @Get('artwork/:id')
  async getArtworkRecommendations(
    @Param('id') artworkId: string,
    @Query('limit') limit?: string,
  ) {
    const results = await this.recommendationsService.getRecommendations(
      artworkId,
      limit ? parseInt(limit, 10) : 10,
    );

    return {
      artworkId,
      recommendations: results,
      total: results.length,
    };
  }

  /**
   * GET /recommendations/personalized?limit=20
   * Get personalized recommendations for the logged-in user
   */
  @Get('personalized')
  @UseGuards(ClerkGuard)
  async getPersonalizedRecommendations(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.auth?.userId;
    if (!userId) {
      return { recommendations: [], total: 0 };
    }

    const results =
      await this.recommendationsService.getPersonalizedRecommendations(
        userId,
        limit ? parseInt(limit, 10) : 20,
      );

    return {
      recommendations: results,
      total: results.length,
    };
  }
}
