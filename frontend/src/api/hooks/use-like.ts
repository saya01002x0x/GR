import type { ApiResponse, LikeStatus } from '@gr/shared';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

export function useLike(artworkId: string) {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['artworks', artworkId, 'like-status'],
    queryFn: () =>
      apiClient.get<ApiResponse<LikeStatus>>(E.artworks.likeStatus(artworkId)),
    enabled: !!isSignedIn,
  });

  const toggleMutation = useMutation({
    mutationFn: () =>
      apiClient.post<ApiResponse<LikeStatus>>(E.artworks.like(artworkId)),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['artworks', artworkId, 'like-status'],
      });

      const previous = queryClient.getQueryData<ApiResponse<LikeStatus>>([
        'artworks',
        artworkId,
        'like-status',
      ]);

      if (previous) {
        queryClient.setQueryData(['artworks', artworkId, 'like-status'], {
          ...previous,
          data: {
            liked: !previous.data.liked,
            likeCount: previous.data.liked
              ? previous.data.likeCount - 1
              : previous.data.likeCount + 1,
          },
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ['artworks', artworkId, 'like-status'],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['artworks', artworkId, 'like-status'],
      });
    },
  });

  const toggleLike = useCallback(() => {
    if (!isSignedIn) {
      return;
    }
    return toggleMutation.mutateAsync();
  }, [isSignedIn, toggleMutation]);

  return {
    liked: data?.data.liked ?? false,
    likeCount: data?.data.likeCount ?? 0,
    toggleLike,
    isLoading: isLoading && !!isSignedIn,
    error,
    isToggling: toggleMutation.isPending,
  };
}
