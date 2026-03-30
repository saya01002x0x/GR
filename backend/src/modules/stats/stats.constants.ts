/**
 * Stats Module Constants
 * Queue names, job names, and Redis key prefixes
 */

// ── BullMQ Queue ──
export const STATS_QUEUE_NAME = 'stats-queue';

// ── Job Names ──
export const JOB_UPDATE_STATS = 'update-stats';

// ── Redis Key Prefixes ──
export const VIEW_LOCK_PREFIX = 'view_lock'; // view_lock:{artworkId}:{userId|ip}
export const VIEW_COUNT_PREFIX = 'view_count'; // view_count:{artworkId}

// ── Meilisearch Sync Buffer ──
export const MEILI_SYNC_BUFFER_KEY = 'meili_sync_buffer'; // Redis Hash

// ── Thresholds ──
export const MEILI_FLUSH_THRESHOLD = 10; // Flush khi buffer >= 10 items
export const MEILI_FLUSH_INTERVAL = 5; // Flush mỗi 5 giây
export const VIEW_LOCK_TTL = 600; // 10 phút (seconds)

// ── Job Interfaces ──
export interface UpdateStatsJob {
  artworkId: string;
  type: 'view' | 'like' | 'comment';
  delta: number;
}
