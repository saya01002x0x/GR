/**
 * Audit Logs Service
 * Shared service for recording admin/mod actions
 * Reference: https://docs.nestjs.com/providers
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditLogsService {
    private readonly logger = new Logger(AuditLogsService.name);

    constructor(private readonly prisma: PrismaService) {}

    async log(
        actorId: string,
        action: string,
        details?: any,
        target?: { id: string; type: string },
    ) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    actorId,
                    action,
                    details: details ?? undefined,
                    targetId: target?.id,
                    targetType: target?.type,
                },
            });
        } catch (error) {
            this.logger.error(`Failed to write audit log: ${action}`, error);
        }
    }

    async findAll(options: {
        page?: number;
        limit?: number;
        action?: string;
        actorId?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const { page = 1, limit = 20, action, actorId, startDate, endDate } = options;

        const where: any = {};
        if (action) where.action = { startsWith: action };
        if (actorId) where.actorId = actorId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    actor: {
                        select: { id: true, username: true, displayName: true, avatar: true, role: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return { logs, total, page, limit };
    }
}
