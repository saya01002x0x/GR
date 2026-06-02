import type { ApiResponse, Comment } from '@gr/shared';
import { useAuth } from '@clerk/nextjs';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

const COMMENTS_LIMIT = 3;

type CommentsResponse = {
  data: Comment[];
  pagination: {
    hasMore: boolean;
    total: number;
  };
};

type CommentsPage = CommentsResponse & { nextOffset: number };

export function useComments(artworkId: string, parentId: string | null = null) {
  const { getToken } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  const queryClient = useQueryClient();

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<CommentsPage>({
    queryKey: ['comments', artworkId, parentId],
    queryFn: ({ pageParam = 0 }) =>
      apiClient.get<CommentsResponse>(
        E.comments.list(artworkId, parentId, COMMENTS_LIMIT, pageParam as number),
      ).then(res => ({
        ...res,
        nextOffset: (pageParam as number) + COMMENTS_LIMIT,
      })),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      return lastPage.nextOffset;
    },
  });

  const allComments = data?.pages.flatMap(page => page.data) ?? [];

  const loadMore = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  const addMutation = useMutation({
    mutationFn: (content: string) =>
      apiClient.post<ApiResponse<Comment>>(E.comments.create(artworkId), {
        content,
        parentId: parentId || undefined,
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(['comments', artworkId, parentId], (old: unknown) => {
        if (!old) {
          return old;
        }
        const typed = old as { pages: CommentsPage[]; pageParams: number[] };
        const firstPage = typed.pages[0];
        const newPage: CommentsPage = {
          data: [response.data],
          pagination: { hasMore: true, total: firstPage?.pagination.total ?? 0 },
          nextOffset: 0,
        };
        return {
          ...typed,
          pages: [newPage, ...typed.pages],
          pageParams: [0, ...typed.pageParams],
        };
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) =>
      apiClient.delete<ApiResponse<void>>(E.comments.delete(commentId)),
    onSuccess: (_, commentId) => {
      queryClient.setQueryData(['comments', artworkId, parentId], (old: unknown) => {
        if (!old) {
          return old;
        }
        const typed = old as { pages: CommentsPage[]; pageParams: number[] };
        return {
          ...typed,
          pages: typed.pages.map(page => ({
            ...page,
            data: page.data.filter(c => c.id !== commentId),
          })),
        };
      });
    },
  });

  return {
    comments: allComments,
    hasMore: hasNextPage ?? false,
    total: data?.pages[data.pages.length - 1]?.pagination.total ?? 0,
    isLoading,
    error,
    loadMore,
    isFetchingMore: isFetchingNextPage,
    addComment: addMutation.mutateAsync,
    deleteComment: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
