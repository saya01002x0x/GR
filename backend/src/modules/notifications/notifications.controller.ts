/**
 * Notifications Controller
 * API endpoints for user notification bell
 */

import { Controller, Delete, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { ClerkGuard } from '../auth/clerk/clerk.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(ClerkGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    @ApiOperation({ summary: 'Get user notifications' })
    async getNotifications(
        @CurrentUser() user: User,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.notificationsService.findByUser(
            user.id,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    async getUnreadCount(@CurrentUser() user: User) {
        return this.notificationsService.getUnreadCount(user.id);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark a notification as read' })
    async markRead(@CurrentUser() user: User, @Param('id') id: string) {
        return this.notificationsService.markRead(id, user.id);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    async markAllRead(@CurrentUser() user: User) {
        return this.notificationsService.markAllRead(user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a notification' })
    async deleteNotification(@CurrentUser() user: User, @Param('id') id: string) {
        return this.notificationsService.delete(id, user.id);
    }
}
