/**
 * Shared Constants
 * Application-wide constants and enums
 */

/**
 * User Roles
 */
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Artwork Status
 */
export const ARTWORK_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export type ArtworkStatus = (typeof ARTWORK_STATUS)[keyof typeof ARTWORK_STATUS];

/**
 * File Upload Limits
 */
export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  IMAGE_ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  
  VIDEO_MAX_SIZE: 100 * 1024 * 1024, // 100MB
  VIDEO_ALLOWED_TYPES: ['video/mp4', 'video/webm'],
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
