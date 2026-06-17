import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationProcessor } from './notification.processor';
import { NotificationListener } from './notification.listener';
import { NOTIFICATION_QUEUE_NAME } from './notification.constants';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE_NAME,
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationProcessor, NotificationListener],
  exports: [BullModule],
})
export class NotificationsModule {}
