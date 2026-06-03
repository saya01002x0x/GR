/**
 * Duplicate Detection Module
 * Perceptual hashing to prevent duplicate image uploads
 */
import { Module } from '@nestjs/common';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { PrismaModule } from '../../database';

@Module({
  imports: [PrismaModule],
  providers: [DuplicateDetectionService],
  exports: [DuplicateDetectionService],
})
export class DuplicateDetectionModule {}
