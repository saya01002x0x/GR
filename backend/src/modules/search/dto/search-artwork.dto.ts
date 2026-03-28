/**
 * Search Artwork DTO
 * Query parameters for advanced artwork search
 * Reference: https://www.meilisearch.com/docs/reference/api/search
 */

import { IsString, IsArray, IsEnum, IsBoolean, IsInt, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum RatingFilter {
    ALL = 'ALL',
    SAFE = 'SAFE',
    R18 = 'R18'
}

export enum SortOption {
    NEWEST = 'newest',
    POPULAR = 'popular'
}

export class SearchArtworkDto {
    @ApiPropertyOptional({ description: 'Search keyword', example: 'Genshin' })
    @IsString()
    @IsOptional()
    q?: string;

    @ApiPropertyOptional({ description: 'Filter by tags (AND logic)', example: ['fantasy', 'landscape'] })
    @IsArray()
    @IsOptional()
    @Transform(({ value }) => {
        // Handle string or array from query params
        if (typeof value === 'string') {
            return value.split(',').map(t => t.trim());
        }
        return value;
    })
    tags?: string[];

    @ApiPropertyOptional({ enum: RatingFilter, description: 'Content rating filter' })
    @IsEnum(RatingFilter)
    @IsOptional()
    rating?: RatingFilter;

    @ApiPropertyOptional({ description: 'Exclude AI-generated artworks' })
    @IsBoolean()
    @Type(() => Boolean)
    @IsOptional()
    excludeAI?: boolean;

    @ApiPropertyOptional({ enum: SortOption, description: 'Sort order' })
    @IsEnum(SortOption)
    @IsOptional()
    sort?: SortOption;

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Results per page', default: 20 })
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    limit?: number = 20;
}
