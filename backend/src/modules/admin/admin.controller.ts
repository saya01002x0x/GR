/**
 * Admin Controller
 * API endpoints for admin panel operations
 */

import { Controller, Get, Delete, Patch, Put, Param, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AdminService } from './admin.service';
import { ClerkGuard } from '../auth/clerk/clerk.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(ClerkGuard, RolesGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly auditLogsService: AuditLogsService,
    ) {}

    // ── Dashboard ──

    @Get('dashboard/stats')
    @Roles('MODERATOR')
    @ApiOperation({ summary: 'Get dashboard stats (Mod+)' })
    async dashboardStats() {
        return this.adminService.getDashboardStats();
    }

    // ── Content Moderation ──

    @Get('artworks/flagged')
    @Roles('MODERATOR')
    @ApiOperation({ summary: 'List flagged artworks (Mod+)' })
    async flaggedArtworks(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.adminService.getFlaggedArtworks(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    @Get('artworks/:id/reports')
    @Roles('MODERATOR')
    @ApiOperation({ summary: 'Get detailed report info for an artwork (Mod+)' })
    async artworkReportDetails(@Param('id') id: string) {
        return this.adminService.getArtworkReportDetails(id);
    }

    @Get('reports/resolved')
    @Roles('MODERATOR')
    @ApiOperation({ summary: 'List resolved reports (Mod+)' })
    async resolvedReports(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.adminService.getResolvedReports(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    @Get('reports/my-history')
    @Roles('MODERATOR')
    @ApiOperation({ summary: 'Get current moderator resolution history (Mod+)' })
    async myModerationHistory(@CurrentUser() user: User, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.adminService.getMyModerationHistory(
            user.id,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    @Patch('artworks/:id/approve')
    @Roles('MODERATOR')
    @ApiOperation({ summary: 'Approve a flagged artwork (Mod+)' })
    async approveArtwork(@CurrentUser() user: User, @Param('id') id: string) {
        return this.adminService.approveArtwork(id, user.id);
    }

    @Patch('artworks/:id/reject')
    @Roles('MODERATOR')
    @ApiOperation({ summary: 'Reject a flagged artwork and warn the author (Mod+)' })
    async rejectArtwork(@CurrentUser() user: User, @Param('id') id: string) {
        return this.adminService.rejectArtwork(id, user.id);
    }

    // ── Warning Management ──

    @Get('users/:id/warnings')
    @Roles('MODERATOR')
    @ApiOperation({ summary: 'Get user warnings (Mod+)' })
    async getUserWarnings(@Param('id') id: string) {
        return this.adminService.getUserWarnings(id);
    }

    @Delete('warnings/:id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Remove a warning (Admin+)' })
    async removeWarning(@CurrentUser() actor: User, @Param('id') id: string) {
        return this.adminService.removeWarning(id);
    }

    // ── User Management ──

    @Get('users')
    @Roles('MODERATOR')
    @ApiOperation({ summary: 'List users (Mod+ for patrol, Admin+ for management)' })
    async getUsers(
        @CurrentUser() actor: User,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('role') role?: string,
        @Query('banned') banned?: string,
    ) {
        return this.adminService.getUsers({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            search, role, banned,
            actorRole: actor.role,
        });
    }

    @Get('users/:id/patrol')
    @Roles('MODERATOR')
    @ApiOperation({ summary: 'Get user patrol info (Mod+)' })
    async getUserPatrol(@Param('id') id: string) {
        return this.adminService.getUserPatrol(id);
    }

    @Patch('users/:id/ban')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Ban a user (Admin+)' })
    async banUser(@CurrentUser() actor: User, @Param('id') id: string) {
        return this.adminService.banUser(id, actor.id, actor.role);
    }

    @Patch('users/:id/unban')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Unban a user (Admin+)' })
    async unbanUser(@CurrentUser() actor: User, @Param('id') id: string) {
        return this.adminService.unbanUser(id);
    }

    @Patch('users/:id/role')
    @Roles('SUPER_ADMIN')
    @ApiOperation({ summary: 'Change user role (Super Admin only)' })
    async changeRole(
        @CurrentUser() actor: User,
        @Param('id') id: string,
        @Body('role') newRole: string,
    ) {
        return this.adminService.changeRole(id, newRole);
    }

    // ── Analytics ──

    @Get('analytics/overview')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get analytics overview (Admin+)' })
    async analyticsOverview() {
        return this.adminService.getAnalyticsOverview();
    }

    @Get('analytics/growth')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get growth data (Admin+)' })
    async analyticsGrowth(@Query('days') days?: string) {
        return this.adminService.getGrowthData(days ? parseInt(days, 10) : 30);
    }

    @Get('analytics/tags/trending')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get trending tags (Admin+)' })
    async trendingTags(@Query('limit') limit?: string) {
        return this.adminService.getTrendingTags(limit ? parseInt(limit, 10) : 10);
    }

    // ── Dynamic Ranking ──

    @Get('ranking/weights')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get ranking weights (Admin+)' })
    async getRankingWeights() {
        return this.adminService.getRankingWeights();
    }

    @Put('ranking/weights')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Update ranking weights (Admin+)' })
    async updateRankingWeights(@CurrentUser() actor: User, @Body() weights: Record<string, number>) {
        return this.adminService.updateRankingWeights(weights);
    }

    // ── Staff Management ──

    @Get('staff')
    @Roles('SUPER_ADMIN')
    @ApiOperation({ summary: 'List staff members (Super Admin only)' })
    async getStaff() {
        return this.adminService.getStaff();
    }

    // ── Audit Logs ──

    @Get('audit-logs')
    @Roles('SUPER_ADMIN')
    @ApiOperation({ summary: 'List audit logs (Super Admin only)' })
    async getAuditLogs(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('action') action?: string,
        @Query('actorId') actorId?: string,
    ) {
        return this.auditLogsService.findAll({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            action,
            actorId,
        });
    }
}
