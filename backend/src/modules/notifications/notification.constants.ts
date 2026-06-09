export const NOTIFICATION_QUEUE_NAME = 'notification-queue';
export const JOB_BATCH_LIKES = 'batch-likes';
export const JOB_BATCH_FOLLOWS = 'batch-follows';

// 1 minute window for testing (to be changed for production)
export const BATCH_INTERVAL_MS = 1 * 60 * 1000;

export interface BatchLikesJob {
  artistId: string;
  artworkId: string;
}

export interface BatchFollowsJob {
  targetUserId: string;
}
