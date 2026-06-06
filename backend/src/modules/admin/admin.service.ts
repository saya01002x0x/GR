/**
 * Admin Service
 * Handle admin operations: moderation, user management, analytics, ranking
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ArtworkStatus, UserRole, Prisma, ReportStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

const WARNING_EXPIRY_DAYS = 30;
const TEMP_BAN_DAYS = 7;
const MAX_WARNINGS_BEFORE_BAN = 3;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Dashboard Stats ──

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingReports,
      flaggedContent,
      bannedToday,
      totalUsers,
      totalArtworks,
    ] = await Promise.all([
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.report.count({
        where: { status: 'PENDING', artworkId: { not: null } },
      }),
      this.prisma.user.count({
        where: { isBanned: true, bannedAt: { gte: today } },
      }),
      this.prisma.user.count(),
      this.prisma.artwork.count({ where: { status: 'PUBLISHED' } }),
    ]);

    return {
      pendingReports,
      flaggedContent,
      bannedToday,
      totalUsers,
      totalArtworks,
    };
  }

  // ── Content Moderation ──

  async getFlaggedArtworks(page = 1, limit = 20) {
    const where: Prisma.ArtworkWhereInput = {
      reports: { some: { status: ReportStatus.PENDING } },
      status: ArtworkStatus.PUBLISHED,
    };

    const [artworks, total] = await Promise.all([
      this.prisma.artwork.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              warningCount: true,
              isBanned: true,
            },
          },
          images: { take: 1, select: { thumbnailUrl: true, url: true } },
          _count: { select: { reports: true } },
          reports: {
            where: { status: 'PENDING' },
            select: {
              id: true,
              reason: true,
              description: true,
              createdAt: true,
            },
            orderBy: { createdAt: Prisma.SortOrder.desc },
          },
        },
        orderBy: { createdAt: Prisma.SortOrder.desc },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.artwork.count({ where }),
    ]);

    return { artworks, total, page, limit };
  }

  async getArtworkReportDetails(artworkId: string) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id: artworkId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            warningCount: true,
            isBanned: true,
            createdAt: true,
            warnings: {
              where: { expiresAt: { gte: new Date() } },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        images: { take: 1, select: { thumbnailUrl: true, url: true } },
        reports: {
          where: { status: 'PENDING' },
          select: {
            id: true,
            reason: true,
            description: true,
            createdAt: true,
            reporter: { select: { username: true, displayName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!artwork) throw new NotFoundException('Artwork not found');
    return artwork;
  }

  async getResolvedReports(page = 1, limit = 20) {
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { status: { in: ['RESOLVED', 'DISMISSED'] } },
        include: {
          artwork: {
            select: {
              id: true,
              title: true,
              status: true,
              images: { take: 1, select: { thumbnailUrl: true, url: true } },
              author: {
                select: { id: true, username: true, displayName: true },
              },
            },
          },
          reporter: { select: { id: true, username: true, displayName: true } },
          resolvedBy: {
            select: { id: true, username: true, displayName: true },
          },
        },
        orderBy: { resolvedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.report.count({
        where: { status: { in: ['RESOLVED', 'DISMISSED'] } },
      }),
    ]);
    return { reports, total, page, limit };
  }

  async getMyModerationHistory(moderatorId: string, page = 1, limit = 20) {
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: {
          resolvedById: moderatorId,
          status: { in: ['RESOLVED', 'DISMISSED'] },
        },
        include: {
          artwork: {
            select: {
              id: true,
              title: true,
              status: true,
              images: { take: 1, select: { thumbnailUrl: true, url: true } },
              author: {
                select: { id: true, username: true, displayName: true },
              },
            },
          },
          reporter: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: { resolvedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.report.count({
        where: {
          resolvedById: moderatorId,
          status: { in: ['RESOLVED', 'DISMISSED'] },
        },
      }),
    ]);
    return { reports, total, page, limit };
  }

  async approveArtwork(artworkId: string, moderatorId: string) {
    await this.prisma.report.updateMany({
      where: { artworkId, status: 'PENDING' },
      data: {
        status: 'DISMISSED',
        resolvedAt: new Date(),
        resolvedById: moderatorId,
      },
    });
    return { success: true };
  }

  async rejectArtwork(artworkId: string, moderatorId: string) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id: artworkId },
      include: {
        author: { select: { id: true, warningCount: true, isBanned: true } },
        reports: {
          where: { status: 'PENDING' },
          select: { reason: true },
          take: 1,
        },
      },
    });
    if (!artwork) throw new NotFoundException('Artwork not found');

    const authorId = artwork.author.id;
    const primaryReason = artwork.reports[0]?.reason ?? 'OTHER';
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + WARNING_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    // Count active (non-expired) warnings
    const activeWarnings = await this.prisma.userWarning.count({
      where: { userId: authorId, expiresAt: { gte: now } },
    });

    const newWarningCount = activeWarnings + 1;

    // Execute DB transaction: hide artwork + create warning + update user warningCount + resolve reports
    await this.prisma.$transaction([
      this.prisma.artwork.update({
        where: { id: artworkId },
        data: { status: 'HIDDEN' as ArtworkStatus },
      }),
      this.prisma.report.updateMany({
        where: { artworkId, status: 'PENDING' },
        data: {
          status: 'RESOLVED',
          resolvedAt: now,
          resolvedById: moderatorId,
        },
      }),
      this.prisma.userWarning.create({
        data: {
          userId: authorId,
          artworkId,
          reason: primaryReason,
          expiresAt,
        },
      }),
      this.prisma.user.update({
        where: { id: authorId },
        data: { warningCount: { increment: 1 } },
      }),
    ]);

    // Determine notification type and ban action based on warning count
    if (newWarningCount >= MAX_WARNINGS_BEFORE_BAN) {
      const bannedUntil = new Date(
        now.getTime() + TEMP_BAN_DAYS * 24 * 60 * 60 * 1000,
      );
      await this.prisma.user.update({
        where: { id: authorId },
        data: {
          isBanned: true,
          bannedAt: now,
          bannedUntil,
          bannedById: moderatorId,
        },
      });

      await this.notificationsService.create({
        userId: authorId,
        type: 'TEMP_BAN',
        title: 'Account temporarily banned for 7 days',
        message: `You have received ${newWarningCount} warnings. Your account will be temporarily banned until ${bannedUntil.toLocaleDateString('vi-VN')}. If you continue to violate the rules after being unbanned, your account will be permanently deleted by Admin.`,
        data: {
          artworkId,
          reason: primaryReason,
          warningCount: newWarningCount,
          bannedUntil: bannedUntil.toISOString(),
        },
      });
    } else {
      await this.notificationsService.create({
        userId: authorId,
        type: 'WARNING',
        title: `Warning ${newWarningCount}/${MAX_WARNINGS_BEFORE_BAN}: Content violation`,
        message: `Your artwork has been hidden due to community rule violation (${primaryReason}). This is the ${newWarningCount}th warning. ${MAX_WARNINGS_BEFORE_BAN - newWarningCount} more warnings will lead to a 7-day temp ban.`,
        data: {
          artworkId,
          reason: primaryReason,
          warningCount: newWarningCount,
        },
      });
    }

    return {
      success: true,
      warningCount: newWarningCount,
      tempBanned: newWarningCount >= MAX_WARNINGS_BEFORE_BAN,
    };
  }

  // ── User Management ──

  private static readonly ROLE_RANK: Record<string, number> = {
    USER: 0,
    MODERATOR: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
  };

  private getRoleRank(role: string): number {
    return AdminService.ROLE_RANK[role] ?? 0;
  }

  private getVisibleRoles(actorRole: string): string[] {
    if (actorRole === 'SUPER_ADMIN') {
      return Object.keys(AdminService.ROLE_RANK);
    }

    const actorRank = this.getRoleRank(actorRole);
    return Object.entries(AdminService.ROLE_RANK)
      .filter(([, rank]) => rank < actorRank)
      .map(([role]) => role);
  }

  async getUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    banned?: string;
    actorRole?: string;
  }) {
    const { page = 1, limit = 20, search, role, banned, actorRole } = options;

    const where: Prisma.UserWhereInput = {};

    if (actorRole) {
      const visibleRoles = this.getVisibleRoles(actorRole);
      if (role) {
        if (!visibleRoles.includes(role)) {
          return { users: [], total: 0, page, limit };
        }
        where.role = role as UserRole;
      } else {
        where.role = { in: visibleRoles as UserRole[] };
      }
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (banned === 'true') where.isBanned = true;
    if (banned === 'false') where.isBanned = false;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatar: true,
          role: true,
          isBanned: true,
          bannedAt: true,
          bannedUntil: true,
          warningCount: true,
          isArtist: true,
          createdAt: true,
          _count: { select: { artworks: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async banUser(userId: string, bannedById: string, actorRole: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isBanned) throw new BadRequestException('User is already banned');
    if (this.getRoleRank(user.role) >= this.getRoleRank(actorRole)) {
      throw new BadRequestException(
        'Cannot ban a user with equal or higher role',
      );
    }

    const result = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedById,
        bannedUntil: null,
      },
    });

    await this.notificationsService.create({
      userId,
      type: 'TEMP_BAN',
      title: 'Tài khoản bị khóa',
      message:
        'Tài khoản của bạn đã bị Admin khóa do vi phạm nghiêm trọng quy tắc cộng đồng. Liên hệ support để biết thêm thông tin.',
      data: { bannedById },
    });

    return result;
  }

  async unbanUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.isBanned) throw new BadRequestException('User is not banned');

    const result = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedById: null,
        bannedUntil: null,
      },
    });

    await this.notificationsService.create({
      userId,
      type: 'UNBAN',
      title: 'Account has been unbanned',
      message:
        'Your account has been restored. Please follow the community rules to avoid being permanently deleted.',
      data: {},
    });

    return result;
  }

  async changeRole(userId: string, newRole: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole as UserRole },
    });
  }

  // ── Warning Management ──

  async getUserWarnings(userId: string) {
    const now = new Date();
    const [active, expired] = await Promise.all([
      this.prisma.userWarning.findMany({
        where: { userId, expiresAt: { gte: now } },
        include: { artwork: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userWarning.findMany({
        where: { userId, expiresAt: { lt: now } },
        include: { artwork: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);
    return { active, expired };
  }

  async removeWarning(warningId: string) {
    const warning = await this.prisma.userWarning.findUnique({
      where: { id: warningId },
    });
    if (!warning) throw new NotFoundException('Warning not found');

    await this.prisma.$transaction([
      this.prisma.userWarning.delete({ where: { id: warningId } }),
      this.prisma.user.update({
        where: { id: warning.userId },
        data: { warningCount: { decrement: 1 } },
      }),
    ]);

    return { success: true };
  }

  // ── Analytics ──

  async getAnalyticsOverview() {
    const [totalUsers, totalArtworks, totalViewsResult, totalLikesResult] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.artwork.count({ where: { status: 'PUBLISHED' } }),
        this.prisma.artwork.aggregate({ _sum: { viewCount: true } }),
        this.prisma.artwork.aggregate({ _sum: { likeCount: true } }),
      ]);

    return {
      totalUsers,
      totalArtworks,
      totalViews: totalViewsResult._sum.viewCount || 0,
      totalLikes: totalLikesResult._sum.likeCount || 0,
    };
  }

  async getGrowthData(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [users, artworks] = await Promise.all([
      this.prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.artwork.findMany({
        where: { createdAt: { gte: startDate }, status: 'PUBLISHED' },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const dayMap = new Map<string, { users: number; artworks: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dayMap.set(d.toISOString().slice(0, 10), { users: 0, artworks: 0 });
    }

    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) entry.users++;
    }
    for (const a of artworks) {
      const key = a.createdAt.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) entry.artworks++;
    }

    return Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  async getTrendingTags(limit = 10) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tags = await this.prisma.artworkTag.groupBy({
      by: ['tagId'],
      where: {
        artwork: { createdAt: { gte: sevenDaysAgo }, status: 'PUBLISHED' },
      },
      _count: { tagId: true },
      orderBy: { _count: { tagId: 'desc' } },
      take: limit,
    });

    const tagIds = tags.map((t) => t.tagId);
    const tagRecords = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
    });

    const tagMap = new Map(tagRecords.map((t) => [t.id, t.name]));

    return tags.map((t) => ({
      name: tagMap.get(t.tagId) || 'unknown',
      count: t._count.tagId,
    }));
  }

  // ── Dynamic Ranking ──

  async getRankingWeights() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'ranking_weights' },
    });

    return (
      setting?.value ?? {
        likeWeight: 3,
        viewWeight: 1,
        commentWeight: 5,
        bookmarkWeight: 4,
        timeDecayFactor: 1.2,
      }
    );
  }

  async updateRankingWeights(weights: Record<string, number>) {
    return this.prisma.systemSetting.upsert({
      where: { key: 'ranking_weights' },
      update: { value: weights },
      create: { key: 'ranking_weights', value: weights },
    });
  }

  // ── Discover & Premium Settings ──

  async getDiscoverSettings() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'discover_settings' },
    });

    return (
      setting?.value ?? {
        promotionPricePerWeek: 5.0, // 5 USD
        rookieAccountAgeDays: 90, // 3 months
        risingStarsAccountAgeDays: 90, // 3 months
        freeTextSearchLimit: 10,
        freeSketchSearchLimit: 2,
      }
    );
  }

  async updateDiscoverSettings(settings: Record<string, any>) {
    return this.prisma.systemSetting.upsert({
      where: { key: 'discover_settings' },
      update: { value: settings },
      create: { key: 'discover_settings', value: settings },
    });
  }

  // ── Staff (SUPER_ADMIN) ──

  async getStaff() {
    return this.prisma.user.findMany({
      where: { role: { in: ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'] } },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
      orderBy: { role: 'desc' },
    });
  }

  // ── User Patrol ──

  async getUserPatrol(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        role: true,
        isBanned: true,
        bannedAt: true,
        bannedUntil: true,
        warningCount: true,
        isArtist: true,
        createdAt: true,
        _count: { select: { artworks: true, comments: true, likes: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const [reports, activeWarnings] = await Promise.all([
      this.prisma.report.findMany({
        where: {
          OR: [{ reporterId: userId }, { artwork: { authorId: userId } }],
        },
        include: {
          artwork: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.userWarning.findMany({
        where: { userId, expiresAt: { gte: now } },
        include: { artwork: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { user, reports, activeWarnings };
  }

  // ==================== PAYOUTS ====================

  async getAllPayouts(status?: string) {
    return this.prisma.payout.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        artist: { select: { id: true, username: true, displayName: true, avatar: true, email: true } },
        approver: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async approvePayout(payoutId: string, adminId: string) {
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });
  }

  async rejectPayout(payoutId: string, adminId: string, reason: string) {
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'REJECTED',
        approvedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }

  async markPayoutAsPaid(payoutId: string, adminId: string) {
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'PAID',
        approvedBy: adminId,
        paidAt: new Date(),
      },
    });
  }
}
