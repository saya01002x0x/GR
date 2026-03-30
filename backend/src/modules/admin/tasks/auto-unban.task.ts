/**
 * Auto-Unban Scheduled Task
 * Runs every hour to lift temporary bans that have expired.
 * After a temp ban expires, if the user continues to violate → Admin review.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class AutoUnbanTask {
  private readonly logger = new Logger(AutoUnbanTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoUnban() {
    const now = new Date();

    const expiredBans = await this.prisma.user.findMany({
      where: {
        isBanned: true,
        bannedUntil: { not: null, lte: now },
      },
      select: { id: true, username: true, warningCount: true },
    });

    if (expiredBans.length === 0) return;

    this.logger.log(
      `Auto-unbanning ${expiredBans.length} users whose temp ban has expired`,
    );

    for (const user of expiredBans) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isBanned: false,
          bannedUntil: null,
          bannedById: null,
          bannedAt: null,
        },
      });

      await this.notificationsService.create({
        userId: user.id,
        type: 'UNBAN',
        title: 'Tài khoản đã được mở khóa',
        message:
          'Lệnh cấm tạm thời của bạn đã hết hạn. Tài khoản được khôi phục, nhưng hãy tuân thủ quy tắc cộng đồng để tránh bị cấm vĩnh viễn.',
        data: { warningCount: user.warningCount },
      });

      this.logger.log(`Auto-unbanned user: ${user.username}`);
    }
  }
}
