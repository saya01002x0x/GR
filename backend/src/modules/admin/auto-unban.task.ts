/**
 * Auto-Unban Scheduled Task
 * Runs every hour to lift temporary bans that have expired.
 * After a temp ban expires, if the user continues to violate 竊・Admin review.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

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
        title: 'Tﾃi kho蘯｣n ﾄ妥｣ ﾄ柁ｰ盻｣c m盻・khﾃｳa',
        message:
          'L盻㌻h c蘯･m t蘯｡m th盻拱 c盻ｧa b蘯｡n ﾄ妥｣ h蘯ｿt h蘯｡n. Tﾃi kho蘯｣n ﾄ柁ｰ盻｣c khﾃｴi ph盻･c, nhﾆｰng hﾃ｣y tuﾃ｢n th盻ｧ quy t蘯ｯc c盻冢g ﾄ黛ｻ渡g ﾄ黛ｻ・trﾃ｡nh b盻・c蘯･m vﾄｩnh vi盻・.',
        data: { warningCount: user.warningCount },
      });

      this.logger.log(`Auto-unbanned user: ${user.username}`);
    }
  }
}
