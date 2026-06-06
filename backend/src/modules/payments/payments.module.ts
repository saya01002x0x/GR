import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { SubscriptionSyncTask } from './subscription-sync.task';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PaymentsController, WebhookController],
  providers: [PaymentsService, StripeService, SubscriptionSyncTask],
  exports: [PaymentsService, StripeService],
})
export class PaymentsModule {}