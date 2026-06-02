import type { ArtworkListItem } from '@/types/artwork';
import { useAuth } from '@clerk/nextjs';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

type ArtworksListResponse = {
  message: string;
  data: ArtworkListItem[];
  pagination: {
    total: number;
    hasMore: boolean;
  };
};

export function useArtistArtworks(
  identifier: string,
  filter?: string,
  { limit = 24 }: { limit?: number } = {},
) {
  const { getToken, isLoaded } = useAuth();
  apiClient.setTokenGetter(getToken);

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['artist-artworks', identifier, filter, limit],
    queryFn: ({ pageParam = 0 }) =>
      apiClient.get<ArtworksListResponse>(
        E.users.artistArtworks(identifier, limit, pageParam as number, filter),
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      const totalLoaded = allPages.reduce((sum, page) => sum + page.data.length, 0);
      return totalLoaded;
    },
    enabled: isLoaded && !!identifier,
  });

  const allArtworks = data?.pages.flatMap(page => page.data) ?? [];

  const loadMore = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  return {
    artworks: allArtworks,
    hasMore: hasNextPage ?? false,
    total: data?.pages[data.pages.length - 1]?.pagination.total ?? 0,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    error,
    loadMore,
  };
}
