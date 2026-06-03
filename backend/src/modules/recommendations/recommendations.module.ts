/**
 * Recommendations Module
 * Collaborative filtering based on user interactions
 * Provides "Users who liked this also liked..." recommendations
 */
import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { InteractionsService } from './interactions.service';
import { PrismaModule } from '../../database';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, InteractionsService],
  exports: [RecommendationsService, InteractionsService],
})
export class RecommendationsModule {}
