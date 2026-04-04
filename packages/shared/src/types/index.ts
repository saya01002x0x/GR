/**
 * Common Types
 * Shared TypeScript interfaces and types
 */

export * from './api';

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T> {
  message: string;
  data: T;
}

/**
 * Paginated API Response
 */
export interface PaginatedResponse<T> {
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Pagination Query Parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * User Payload (from Clerk JWT)
 */
export interface UserPayload {
  userId: string;
  sessionId: string;
  email?: string;
  fullName?: string;
  imageUrl?: string;
}

/**
 * File Upload
 */
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
