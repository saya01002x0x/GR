/**
 * Reports Controller
 * API endpoints for report management
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto, ResolveReportDto } from './dto/create-report.dto';
import { ClerkGuard } from '../auth/clerk/clerk.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { User } from '@prisma/client';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post()
  @UseGuards(ClerkGuard)
  @ApiOperation({ summary: 'Create a new report' })
  async create(@CurrentUser() user: User, @Body() dto: CreateReportDto) {
    return this.reportsService.create(user.id, {
      reason: dto.reason,
      description: dto.description,
      artworkId: dto.artworkId,
    });
  }

  @Get()
  @UseGuards(ClerkGuard, RolesGuard)
  @Roles('MODERATOR')
  @ApiOperation({ summary: 'List reports (Mod+)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('reason') reason?: string,
  ) {
    return this.reportsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      reason,
    });
  }

  @Patch(':id/resolve')
  @UseGuards(ClerkGuard, RolesGuard)
  @Roles('MODERATOR')
  @ApiOperation({ summary: 'Resolve a report (Mod+)' })
  async resolve(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    const result = await this.reportsService.resolve(id, user.id, {
      status: dto.status,
      resolution: dto.resolution,
    });

    await this.auditLogsService.log(
      user.id,
      `report.${dto.status.toLowerCase()}`,
      { reportId: id, resolution: dto.resolution },
      { id, type: 'report' },
    );

    return result;
  }

  @Get('stats')
  @UseGuards(ClerkGuard, RolesGuard)
  @Roles('MODERATOR')
  @ApiOperation({ summary: 'Get report stats (Mod+)' })
  async stats() {
    return this.reportsService.getStats();
  }
}
