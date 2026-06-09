/**
 * Notifications Service
 * Manages in-app notifications for the user notification bell
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(userId: string, input: {
    type: NotificationType;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.create({
      userId,
      type: input.type,
      title: input.title,
      message: input.content,
      data: input.metadata,
    });
  }

  async create(input: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: (input.data as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, total, unreadCount, page, limit };
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async getPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return prefs;
  }

  async updatePreferences(userId: string, data: Partial<Prisma.NotificationPreferenceUpdateInput>) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        followWeb: data.followWeb as boolean ?? true,
        likeWeb: data.likeWeb as boolean ?? true,
        commentWeb: data.commentWeb as boolean ?? true,
        mentionWeb: data.mentionWeb as boolean ?? true,
        newArtworkWeb: data.newArtworkWeb as boolean ?? true,
        weeklyNewsletter: data.weeklyNewsletter as boolean ?? true,
        productUpdates: data.productUpdates as boolean ?? true,
      },
    });
  }

  async shouldNotify(userId: string, type: 'followWeb' | 'likeWeb' | 'commentWeb' | 'mentionWeb' | 'newArtworkWeb'): Promise<boolean> {
    const prefs = await this.getPreferences(userId);
    return prefs[type] === true;
  }
}
