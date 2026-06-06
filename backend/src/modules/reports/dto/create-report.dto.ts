import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportReasonDto {
  SPAM = 'SPAM',
  NSFW = 'NSFW',
  DUPLICATE = 'DUPLICATE',
  COPYRIGHT = 'COPYRIGHT',
  HARASSMENT = 'HARASSMENT',
  OTHER = 'OTHER',
}

export class CreateReportDto {
  @ApiProperty({ enum: ReportReasonDto })
  @IsEnum(ReportReasonDto)
  reason: ReportReasonDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  artworkId: string;
}

export class ResolveReportDto {
  @ApiProperty({ enum: ['RESOLVED', 'DISMISSED'] })
  @IsEnum({ RESOLVED: 'RESOLVED', DISMISSED: 'DISMISSED' })
  status: 'RESOLVED' | 'DISMISSED';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  resolution?: string;
}
