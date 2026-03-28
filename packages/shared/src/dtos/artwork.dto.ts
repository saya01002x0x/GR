/**
 * Artwork DTOs
 * Data Transfer Objects for artwork-related operations
 */

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ARTWORK_STATUS, ArtworkStatus } from '../constants';

/**
 * Create Artwork DTO
 */
export class CreateArtworkDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(ARTWORK_STATUS)
  status?: ArtworkStatus;
}

/**
 * Update Artwork DTO
 */
export class UpdateArtworkDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(ARTWORK_STATUS)
  status?: ArtworkStatus;
}
