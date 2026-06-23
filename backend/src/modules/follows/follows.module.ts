import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../database/prisma.module';
import { FollowsService } from './follows.service';
import { FollowsController } from './follows.controller';
import { NOTIFICATION_QUEUE_NAME } from '../notifications/notification.constants';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE_NAME,
    }),
  ],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
