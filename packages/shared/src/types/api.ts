export interface CommentUser {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
}

export interface Comment {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: CommentUser;
  replyCount: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  isDefault: boolean;
  artworkCount: number;
  createdAt: string;
}

export interface ArtworkCollectionStatus {
  isSaved: boolean;
  collectionIds: string[];
}

export interface LikeStatus {
  liked: boolean;
  likeCount: number;
}

export interface ArtworkAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
}

export interface Artwork {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  author: ArtworkAuthor;
  tags: string[];
  rating: string;
  isAI: boolean;
  createdAt: number;
  likeCount: number;
  viewCount: number;
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
}

export interface Artist {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
}

export interface SearchHit {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  author: ArtworkAuthor;
  tags: string[];
  rating: string;
  isAI: boolean;
  createdAt: number;
  likeCount: number;
  viewCount: number;
}

export interface SearchResponse {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  processingTimeMs: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
