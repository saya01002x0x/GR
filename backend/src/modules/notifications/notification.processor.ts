import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from './notifications.service';
import {
  NOTIFICATION_QUEUE_NAME,
  JOB_BATCH_LIKES,
  JOB_BATCH_FOLLOWS,
  BatchLikesJob,
  BatchFollowsJob,
} from './notification.constants';
import { NotificationType } from '@prisma/client';

@Processor(NOTIFICATION_QUEUE_NAME)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case JOB_BATCH_LIKES:
        return this.handleBatchLikes(job as Job<BatchLikesJob>);
      case JOB_BATCH_FOLLOWS:
        return this.handleBatchFollows(job as Job<BatchFollowsJob>);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleBatchLikes(job: Job<BatchLikesJob>) {
    const { artistId, artworkId } = job.data;
    
    // Check preferences
    const shouldNotify = await this.notificationsService.shouldNotify(artistId, 'likeWeb');
    if (!shouldNotify) return;

    // Get artwork details
    const artwork = await this.prisma.artwork.findUnique({
      where: { id: artworkId },
      select: { title: true },
    });

    if (!artwork) return;

    await this.notificationsService.createNotification(artistId, {
      type: NotificationType.LIKE,
      title: 'New Likes',
      content: `Your artwork "${artwork.title}" received new likes!`,
      metadata: { artworkId },
    });
  }

  private async handleBatchFollows(job: Job<BatchFollowsJob>) {
    const { targetUserId } = job.data;

    const shouldNotify = await this.notificationsService.shouldNotify(targetUserId, 'followWeb');
    if (!shouldNotify) return;

    // Get recent followers to construct the message
    const recentFollowers = await this.prisma.follow.findMany({
      where: { followingId: targetUserId },
      orderBy: { createdAt: 'desc' },
      take: 2,
      include: { follower: { select: { displayName: true, username: true } } },
    });

    if (recentFollowers.length === 0) return;

    const firstFollower = recentFollowers[0].follower;
    const name = firstFollower.displayName || firstFollower.username;
    
    // Simplification: we just count total for now, or assume this job represents a batch 
    // Ideally we'd store the count in redis and reset it, but for test, we'll just say "and others" if total > 1
    const count = await this.prisma.follow.count({
      where: { followingId: targetUserId },
    });

    let content = `${name} is now following you!`;
    if (count > 1) {
      content = `${name} and ${count - 1} others started following you!`;
    }

    await this.notificationsService.createNotification(targetUserId, {
      type: NotificationType.FOLLOW,
      title: 'New Followers',
      content,
    });
  }
}
