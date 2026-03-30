/**
 * useComments hook
 * Handle comments with pagination and recursive replies
 */

import { useAuth } from '@clerk/nextjs';
import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { authFetcher, deleteFetcher, postFetcher } from '@/libs/fetcher';

export type Comment = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  replyCount: number;
};

type CommentsResponse = {
  data: Comment[];
  pagination: {
    hasMore: boolean;
    total: number;
  };
};

export function useComments(artworkId: string, parentId: string | null = null) {
  const { getToken, isSignedIn } = useAuth();
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const cacheKey = parentId
    ? `/artworks/${artworkId}/comments?parentId=${parentId}&limit=3&offset=${offset}`
    : `/artworks/${artworkId}/comments?parentId=null&limit=3&offset=${offset}`;

  const { data, error, mutate } = useSWR<CommentsResponse>(
    cacheKey,
    async (url: string) => {
      const token = await getToken();
      return authFetcher(url, token);
    },
    {
      onSuccess: (response) => {
        if (offset === 0) {
          setAllComments(response.data);
        } else {
          setAllComments(prev => [...prev, ...response.data]);
        }
        setHasMore(response.pagination.hasMore);
      },
    },
  );

  const loadMore = useCallback(() => {
    if (hasMore) {
      setOffset(prev => prev + 3);
    }
  }, [hasMore]);

  const addComment = useCallback(
    async (content: string) => {
      if (!isSignedIn) {
        return;
      }

      const token = await getToken();
      const response = await postFetcher(`/artworks/${artworkId}/comments`, token, {
        content,
        parentId: parentId || undefined,
      });

      // Add new comment to the beginning
      setAllComments(prev => [response.data, ...prev]);
      mutate();
    },
    [artworkId, parentId, getToken, isSignedIn, mutate],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!isSignedIn) {
        return;
      }

      const token = await getToken();
      await deleteFetcher(`/comments/${commentId}`, token);

      // Remove comment from list
      setAllComments(prev => prev.filter(c => c.id !== commentId));
      mutate();
    },
    [getToken, isSignedIn, mutate],
  );

  return {
    comments: allComments,
    hasMore,
    loadMore,
    addComment,
    deleteComment,
    isLoading: !error && !data,
    error,
    total: data?.pagination.total ?? 0,
  };
}
