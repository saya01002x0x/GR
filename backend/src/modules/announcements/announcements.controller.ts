/**
 * Announcements Controller
 */

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { ClerkGuard } from '../auth/clerk/clerk.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@ApiTags('Announcements')
@Controller()
@UseInterceptors(AuditLogInterceptor)
export class AnnouncementsController {
    constructor(
        private readonly announcementsService: AnnouncementsService,
        private readonly auditLogsService: AuditLogsService,
    ) {}

    @Get('announcements/active')
    @ApiOperation({ summary: 'Get active announcements (public)' })
    async getActive() {
        return this.announcementsService.getActive();
    }

    @Post('admin/announcements')
    @UseGuards(ClerkGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Create announcement (Admin+)' })
    async create(@CurrentUser() user: any, @Body() body: { title: string; content: string; type?: string; expiresAt?: string }) {
        return this.announcementsService.create(user.id, body);
    }

    @Get('admin/announcements')
    @UseGuards(ClerkGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'List announcements (Admin+)' })
    async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.announcementsService.findAll(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    @Patch('admin/announcements/:id')
    @UseGuards(ClerkGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Update announcement (Admin+)' })
    async update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
        return this.announcementsService.update(id, body);
    }

    @Delete('admin/announcements/:id')
    @UseGuards(ClerkGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Delete announcement (Admin+)' })
    async remove(@CurrentUser() user: any, @Param('id') id: string) {
        return this.announcementsService.remove(id);
    }
}
