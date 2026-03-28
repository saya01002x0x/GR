/**
 * useLike hook
 * Handle like/unlike with optimistic updates
 */

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';
import useSWR from 'swr';
import { authFetcher, postFetcher } from '@/lib/fetcher';

type LikeStatus = {
  liked: boolean;
  likeCount: number;
};

export function useLike(artworkId: string) {
  const { getToken, isSignedIn } = useAuth();

  const { data, error, mutate } = useSWR<{ data: LikeStatus }>(
    isSignedIn ? `/artworks/${artworkId}/like-status` : null,
    async (url: string) => {
      const token = await getToken();
      return authFetcher(url, token);
    },
  );

  const toggleLike = useCallback(async () => {
    if (!isSignedIn) {
      // Could redirect to login or show modal
      return;
    }

    // Optimistic update
    await mutate(
      async () => {
        const token = await getToken();
        const response = await postFetcher(`/artworks/${artworkId}/like`, token);
        return response;
      },
      {
        optimisticData: data
          ? {
              data: {
                liked: !data.data.liked,
                likeCount: data.data.liked
                  ? data.data.likeCount - 1
                  : data.data.likeCount + 1,
              },
            }
          : undefined,
        rollbackOnError: true,
        revalidate: false,
      },
    );
  }, [artworkId, getToken, isSignedIn, mutate, data]);

  return {
    liked: data?.data.liked ?? false,
    likeCount: data?.data.likeCount ?? 0,
    toggleLike,
    isLoading: !error && !data && isSignedIn,
    error,
  };
}
