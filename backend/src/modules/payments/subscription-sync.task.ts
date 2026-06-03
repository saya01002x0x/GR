import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentsService } from './payments.service';

@Injectable()
export class SubscriptionSyncTask {
  private readonly logger = new Logger(SubscriptionSyncTask.name);

  constructor(private readonly payments: PaymentsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleSync() {
    try {
      const result = await this.payments.expireEndedSubscriptions();
      if (result.platformExpired > 0 || result.tierExpired > 0) {
        this.logger.log(
          `Expired subscriptions synced. platform=${result.platformExpired}, tiers=${result.tierExpired}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to sync expired subscriptions', error);
    }
  }
}
