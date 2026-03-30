/**
 * Announcements Service
 * Handle system-wide announcements
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AnnouncementType } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    authorId: string,
    data: { title: string; content: string; type?: string; expiresAt?: string },
  ) {
    return this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        type: (data.type as AnnouncementType) || 'INFO',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        authorId,
      },
    });
  }

  async findAll(page = 1, limit = 20) {
    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        include: {
          author: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.announcement.count(),
    ]);

    return { announcements, total, page, limit };
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      content: string;
      type: string;
      isActive: boolean;
      expiresAt: string;
    }>,
  ) {
    const existing = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Announcement not found');

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.type !== undefined && { type: data.type as AnnouncementType }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.expiresAt !== undefined && {
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        }),
      },
    });
  }

  async remove(id: string) {
    await this.prisma.announcement.delete({ where: { id } });
    return { success: true };
  }

  async getActive() {
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }
}
