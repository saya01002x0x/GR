/**
 * Reports Service
 * Handle report CRUD operations
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ReportReason, ReportStatus, Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(reporterId: string, data: { reason: string; description?: string; artworkId: string }) {
        return this.prisma.report.create({
            data: {
                reason: data.reason as ReportReason,
                description: data.description,
                artworkId: data.artworkId,
                reporterId,
            },
            include: {
                artwork: { select: { id: true, title: true } },
            },
        });
    }

    async findAll(options: {
        page?: number;
        limit?: number;
        status?: string;
        reason?: string;
    }) {
        const { page = 1, limit = 20, status, reason } = options;

        const where: Prisma.ReportWhereInput = {};
        if (status) where.status = status as ReportStatus;
        if (reason) where.reason = reason as ReportReason;

        const [reports, total] = await Promise.all([
            this.prisma.report.findMany({
                where,
                include: {
                    artwork: {
                        select: { id: true, title: true, images: { take: 1, select: { thumbnailUrl: true, url: true } } },
                    },
                    reporter: { select: { id: true, username: true, displayName: true, avatar: true } },
                    resolvedBy: { select: { id: true, username: true, displayName: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.report.count({ where }),
        ]);

        return { reports, total, page, limit };
    }

    async resolve(
        reportId: string,
        resolvedById: string,
        data: { status: 'RESOLVED' | 'DISMISSED'; resolution?: string },
    ) {
        return this.prisma.report.update({
            where: { id: reportId },
            data: {
                status: data.status as ReportStatus,
                resolution: data.resolution,
                resolvedById,
                resolvedAt: new Date(),
            },
        });
    }

    async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [pending, resolvedToday, totalToday] = await Promise.all([
            this.prisma.report.count({ where: { status: 'PENDING' } }),
            this.prisma.report.count({ where: { status: 'RESOLVED', resolvedAt: { gte: today } } }),
            this.prisma.report.count({ where: { createdAt: { gte: today } } }),
        ]);

        return { pending, resolvedToday, totalToday };
    }
}
