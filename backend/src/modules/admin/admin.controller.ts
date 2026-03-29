/**
 * Admin Controller
 * API endpoints for admin panel operations
 */

import { Controller, Get, Delete, Patch, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ClerkGuard } from '../auth/clerk/clerk.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(ClerkGuard, RolesGuard)
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
    async myModerationHistory(@CurrentUser() user: any, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.adminService.getMyModerationHistory(
            user.id,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    @Patch('artworks/:id/approve')
    @Roles('MODERATOR')
    @ApiOperation({ summary: 'Approve a flagged artwork (Mod+)' })
    async approveArtwork(@CurrentUser() user: any, @Param('id') id: string) {
        const result = await this.adminService.approveArtwork(id, user.id);
        await this.auditLogsService.log(user.id, 'artwork.approve', null, { id, type: 'artwork' });
        return result;
    }

    @Patch('artworks/:id/reject')
    @Roles('MODERATOR')
    @ApiOperation({ summary: 'Reject a flagged artwork and warn the author (Mod+)' })
    async rejectArtwork(@CurrentUser() user: any, @Param('id') id: string) {
        const result = await this.adminService.rejectArtwork(id, user.id);
        await this.auditLogsService.log(user.id, 'artwork.reject', { tempBanned: result.tempBanned, warningCount: result.warningCount }, { id, type: 'artwork' });
        return result;
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
    async removeWarning(@CurrentUser() actor: any, @Param('id') id: string) {
        const result = await this.adminService.removeWarning(id);
        await this.auditLogsService.log(actor.id, 'warning.remove', null, { id, type: 'warning' });
        return result;
    }

    // ── User Management ──

    @Get('users')
    @Roles('MODERATOR')
    @ApiOperation({ summary: 'List users (Mod+ for patrol, Admin+ for management)' })
    async getUsers(
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
    async banUser(@CurrentUser() actor: any, @Param('id') id: string) {
        const result = await this.adminService.banUser(id, actor.id);
        await this.auditLogsService.log(actor.id, 'user.ban', null, { id, type: 'user' });
        return result;
    }

    @Patch('users/:id/unban')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Unban a user (Admin+)' })
    async unbanUser(@CurrentUser() actor: any, @Param('id') id: string) {
        const result = await this.adminService.unbanUser(id);
        await this.auditLogsService.log(actor.id, 'user.unban', null, { id, type: 'user' });
        return result;
    }

    @Patch('users/:id/role')
    @Roles('SUPER_ADMIN')
    @ApiOperation({ summary: 'Change user role (Super Admin only)' })
    async changeRole(
        @CurrentUser() actor: any,
        @Param('id') id: string,
        @Body('role') newRole: string,
    ) {
        const result = await this.adminService.changeRole(id, newRole);
        await this.auditLogsService.log(
            actor.id, 'user.role_change',
            { newRole },
            { id, type: 'user' },
        );
        return result;
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
    async updateRankingWeights(@CurrentUser() actor: any, @Body() weights: Record<string, number>) {
        const result = await this.adminService.updateRankingWeights(weights);
        await this.auditLogsService.log(actor.id, 'ranking.update', { weights });
        return result;
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
