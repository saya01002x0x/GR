import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NOTIFICATION_QUEUE_NAME,
  JOB_BATCH_FOLLOWS,
  BatchFollowsJob,
  BATCH_INTERVAL_MS,
} from '../notifications/notification.constants';

@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(NOTIFICATION_QUEUE_NAME)
    private readonly notificationQueue: Queue,
  ) {}

  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Ensure the target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      this.logger.log(`User ${followerId} unfollowed ${followingId}`);

      const followerCount = await this.prisma.follow.count({
        where: { followingId },
      });

      return { followed: false, followerCount };
    } else {
      await this.prisma.follow.create({
        data: { followerId, followingId },
      });

      this.logger.log(`User ${followerId} followed ${followingId}`);

      // Push to notification queue for batching
      try {
        const jobData: BatchFollowsJob = {
          targetUserId: followingId,
        };

        const timeWindow = Math.floor(Date.now() / BATCH_INTERVAL_MS);
        const jobId = `batch-follow:${followingId}:${timeWindow}`;

        await this.notificationQueue.add(JOB_BATCH_FOLLOWS, jobData, {
          jobId,
          delay: BATCH_INTERVAL_MS,
          removeOnComplete: true,
          removeOnFail: 100,
        });
      } catch (queueError: unknown) {
        this.logger.error(
          `Failed to queue follow notification for user ${followingId}`,
          queueError instanceof Error ? queueError.message : String(queueError),
        );
      }

      const followerCount = await this.prisma.follow.count({
        where: { followingId },
      });

      return { followed: true, followerCount };
    }
  }

  async getFollowStatus(followerId: string, followingId: string) {
    const [follow, followerCount] = await Promise.all([
      this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId, followingId } },
      }),
      this.prisma.follow.count({
        where: { followingId },
      }),
    ]);

    return {
      isFollowing: !!follow,
      followerCount,
    };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              bio: true,
              isArtist: true,
              _count: { select: { followers: true, artworks: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    return {
      items: follows.map((f) => f.follower),
      total,
      page,
      limit,
    };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              bio: true,
              isArtist: true,
              _count: { select: { followers: true, artworks: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      items: follows.map((f) => f.following),
      total,
      page,
      limit,
    };
  }

  async getFeed(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const followingIds = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }).then(follows => follows.map(f => f.followingId));

    if (followingIds.length === 0) {
      return { items: [], total: 0, page, limit, hasMore: false };
    }

    const [artworks, total] = await Promise.all([
      this.prisma.artwork.findMany({
        where: {
          authorId: { in: followingIds },
          status: 'PUBLISHED',
          visibility: 'PUBLIC', // Note: Tier-gated works from following could be fetched if we join with tiers
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          images: {
            take: 1,
            orderBy: { order: 'asc' as const },
          },
          requiredTier: {
            select: { id: true, name: true, price: true, currency: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.artwork.count({
        where: {
          authorId: { in: followingIds },
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
        },
      }),
    ]);

    return {
      items: artworks.map(artwork => ({
        ...artwork,
        access: {
          isOwner: false,
          isSubscribed: false,
          canViewFull: artwork.visibility === 'PUBLIC',
        },
      })),
      total,
      page,
      limit,
      hasMore: skip + artworks.length < total,
    };
  }
}
