import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('artwork.liked')
  async handleArtworkLiked(payload: {
    authorId: string;
    artworkId: string;
    artworkTitle: string;
    user: { id: string; username: string; displayName: string | null; avatar: string | null };
  }) {
    try {
      const shouldNotify = await this.notificationsService.shouldNotify(
        payload.authorId,
        'likeWeb',
      );

      if (shouldNotify) {
        const displayName = payload.user.displayName || payload.user.username;
        await this.notificationsService.createNotification(payload.authorId, {
          type: NotificationType.LIKE,
          title: 'New Like',
          content: `${displayName} liked your artwork "${payload.artworkTitle}".`,
          metadata: {
            artworkId: payload.artworkId,
            userId: payload.user.id,
            username: payload.user.username,
            avatar: payload.user.avatar,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to handle artwork.liked event', error);
    }
  }

  @OnEvent('artwork.commented')
  async handleArtworkCommented(payload: {
    authorId: string;
    artworkId: string;
    artworkTitle: string;
    commentId: string;
    user: { id: string; username: string; displayName: string | null; avatar: string | null };
  }) {
    try {
      const shouldNotify = await this.notificationsService.shouldNotify(
        payload.authorId,
        'commentWeb',
      );
      if (shouldNotify) {
        const displayName = payload.user.displayName || payload.user.username;
        await this.notificationsService.createNotification(payload.authorId, {
          type: NotificationType.COMMENT,
          title: 'New Comment',
          content: `${displayName} commented on your artwork "${payload.artworkTitle}".`,
          metadata: {
            artworkId: payload.artworkId,
            commentId: payload.commentId,
            userId: payload.user.id,
            username: payload.user.username,
            avatar: payload.user.avatar,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to handle artwork.commented event', error);
    }
  }

  @OnEvent('artwork.published')
  async handleArtworkPublished(payload: {
    followerId: string;
    artworkId: string;
    artistId: string;
    artistName: string;
    artworkTitle: string;
  }) {
    try {
      const shouldNotify = await this.notificationsService.shouldNotify(
        payload.followerId,
        'newArtworkWeb',
      );
      if (shouldNotify) {
        await this.notificationsService.createNotification(payload.followerId, {
          type: NotificationType.NEW_ARTWORK,
          title: 'New Artwork',
          content: `${payload.artistName} just published "${payload.artworkTitle}"`,
          metadata: { artworkId: payload.artworkId, artistId: payload.artistId },
        });
      }
    } catch (error) {
      this.logger.error('Failed to handle artwork.published event', error);
    }
  }

  @OnEvent('admin.notified')
  async handleAdminNotified(payload: {
    userId: string;
    type: NotificationType;
    title: string;
    content: string;
    metadata?: any;
  }) {
    try {
      await this.notificationsService.create({
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.content,
        data: payload.metadata || {},
      });
    } catch (error) {
      this.logger.error('Failed to handle admin.notified event', error);
    }
  }
}
