/**
 * Shared artwork types for API responses
 * Reference: Backend ArtworksService
 */

// Author info included in artwork responses
export type ArtworkAuthor = {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
};

// Image info from ArtworkImage model
export type ArtworkImage = {
  id: string;
  url: string;
  thumbnailUrl: string;
  blurredUrl?: string;
  width: number;
  height: number;
  aspectRatio: number;
  order: number;
};

// Tag relation from ArtworkTag model
export type ArtworkTagRelation = {
  tag: {
    id: string;
    name: string;
  };
};

/**
 * Artwork list item (for grids, cards)
 * From GET /artworks
 */
export type ArtworkListItem = {
  id: string;
  title: string;
  description: string | null;
  rating: 'SAFE' | 'R18' | 'R18G';
  isAI: boolean;
  status: string;
  createdAt: string;
  author: ArtworkAuthor;
  images: ArtworkImage[];
};

/**
 * Full artwork detail
 * From GET /artworks/:id
 */
export type ArtworkDetail = {
  id: string;
  title: string;
  description: string | null;
  rating: 'SAFE' | 'R18' | 'R18G';
  isAI: boolean;
  status: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  author: ArtworkAuthor;
  images: ArtworkImage[];
  tags: ArtworkTagRelation[];
};

/**
 * API response wrapper
 */
export type ArtworksListResponse = {
  message: string;
  data: ArtworkListItem[];
  pagination: {
    total: number;
    hasMore: boolean;
  };
};

export type ArtworkDetailResponse = {
  message: string;
  data: ArtworkDetail | null;
};

export type RelatedArtworksResponse = {
  message: string;
  data: ArtworkListItem[];
};
