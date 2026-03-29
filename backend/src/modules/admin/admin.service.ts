/**
 * Admin Service
 * Handle admin operations: moderation, user management, analytics, ranking
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ArtworkStatus, UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) {}

    // ── Dashboard Stats ──

    async getDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [pendingReports, flaggedContent, bannedToday, totalUsers, totalArtworks] = await Promise.all([
            this.prisma.report.count({ where: { status: 'PENDING' } }),
            this.prisma.report.count({
                where: { status: 'PENDING', artworkId: { not: null } },
            }),
            this.prisma.user.count({ where: { isBanned: true, bannedAt: { gte: today } } }),
            this.prisma.user.count(),
            this.prisma.artwork.count({ where: { status: 'PUBLISHED' } }),
        ]);

        return { pendingReports, flaggedContent, bannedToday, totalUsers, totalArtworks };
    }

    // ── Content Moderation ──

    async getFlaggedArtworks(page = 1, limit = 20) {
        const where = {
            reports: { some: { status: 'PENDING' as any } },
            status: 'PUBLISHED' as ArtworkStatus,
        };

        const [artworks, total] = await Promise.all([
            this.prisma.artwork.findMany({
                where,
                include: {
                    author: { select: { id: true, username: true, displayName: true, avatar: true } },
                    images: { take: 1, select: { thumbnailUrl: true, url: true } },
                    _count: { select: { reports: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.artwork.count({ where }),
        ]);

        return { artworks, total, page, limit };
    }

    async approveArtwork(artworkId: string) {
        await this.prisma.report.updateMany({
            where: { artworkId, status: 'PENDING' },
            data: { status: 'DISMISSED', resolvedAt: new Date() },
        });
        return { success: true };
    }

    async rejectArtwork(artworkId: string) {
        const artwork = await this.prisma.artwork.findUnique({ where: { id: artworkId } });
        if (!artwork) throw new NotFoundException('Artwork not found');

        await this.prisma.$transaction([
            this.prisma.artwork.update({
                where: { id: artworkId },
                data: { status: 'HIDDEN' as ArtworkStatus },
            }),
            this.prisma.report.updateMany({
                where: { artworkId, status: 'PENDING' },
                data: { status: 'RESOLVED', resolvedAt: new Date() },
            }),
        ]);

        return { success: true };
    }

    // ── User Management ──

    async getUsers(options: { page?: number; limit?: number; search?: string; role?: string; banned?: string }) {
        const { page = 1, limit = 20, search, role, banned } = options;

        const where: any = {};
        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { displayName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role) where.role = role as UserRole;
        if (banned === 'true') where.isBanned = true;
        if (banned === 'false') where.isBanned = false;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true, username: true, email: true, displayName: true, avatar: true,
                    role: true, isBanned: true, bannedAt: true, isArtist: true, createdAt: true,
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

    async banUser(userId: string, bannedById: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.isBanned) throw new BadRequestException('User is already banned');
        if (user.role === 'SUPER_ADMIN') throw new BadRequestException('Cannot ban a Super Admin');

        return this.prisma.user.update({
            where: { id: userId },
            data: { isBanned: true, bannedAt: new Date(), bannedById },
        });
    }

    async unbanUser(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (!user.isBanned) throw new BadRequestException('User is not banned');

        return this.prisma.user.update({
            where: { id: userId },
            data: { isBanned: false, bannedAt: null, bannedById: null },
        });
    }

    async changeRole(userId: string, newRole: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        return this.prisma.user.update({
            where: { id: userId },
            data: { role: newRole as UserRole },
        });
    }

    // ── Analytics ──

    async getAnalyticsOverview() {
        const [totalUsers, totalArtworks, totalViews, totalLikes] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.artwork.count({ where: { status: 'PUBLISHED' } }),
            this.prisma.artwork.aggregate({ _sum: { viewCount: true } }),
            this.prisma.artwork.aggregate({ _sum: { likeCount: true } }),
        ]);

        return {
            totalUsers,
            totalArtworks,
            totalViews: totalViews._sum.viewCount || 0,
            totalLikes: totalLikes._sum.likeCount || 0,
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

        const tagIds = tags.map(t => t.tagId);
        const tagRecords = await this.prisma.tag.findMany({
            where: { id: { in: tagIds } },
        });

        const tagMap = new Map(tagRecords.map(t => [t.id, t.name]));

        return tags.map(t => ({
            name: tagMap.get(t.tagId) || 'unknown',
            count: t._count.tagId,
        }));
    }

    // ── Dynamic Ranking ──

    async getRankingWeights() {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'ranking_weights' },
        });

        return setting?.value ?? {
            likeWeight: 3,
            viewWeight: 1,
            commentWeight: 5,
            bookmarkWeight: 4,
            timeDecayFactor: 1.2,
        };
    }

    async updateRankingWeights(weights: Record<string, number>) {
        return this.prisma.systemSetting.upsert({
            where: { key: 'ranking_weights' },
            update: { value: weights },
            create: { key: 'ranking_weights', value: weights },
        });
    }

    // ── Staff (SUPER_ADMIN) ──

    async getStaff() {
        return this.prisma.user.findMany({
            where: { role: { in: ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'] } },
            select: {
                id: true, username: true, email: true, displayName: true,
                avatar: true, role: true, createdAt: true,
            },
            orderBy: { role: 'desc' },
        });
    }

    // ── User Patrol ──

    async getUserPatrol(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, username: true, email: true, displayName: true, avatar: true,
                role: true, isBanned: true, bannedAt: true, isArtist: true, createdAt: true,
                _count: { select: { artworks: true, comments: true, likes: true } },
            },
        });

        if (!user) throw new NotFoundException('User not found');

        const reports = await this.prisma.report.findMany({
            where: {
                OR: [
                    { reporterId: userId },
                    { artwork: { authorId: userId } },
                ],
            },
            include: {
                artwork: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        return { user, reports };
    }
}
