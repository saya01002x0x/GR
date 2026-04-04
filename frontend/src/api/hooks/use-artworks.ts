import type { ArtworkDetail, ArtworkListItem } from '@/types/artwork';
import { useAuth } from '@clerk/nextjs';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

type ArtworkDetailResponse = {
  message: string;
  data: ArtworkDetail | null;
};

type ArtworksListResponse = {
  message: string;
  data: ArtworkListItem[];
  pagination: {
    total: number;
    hasMore: boolean;
  };
};

type RelatedArtworksResponse = {
  message: string;
  data: ArtworkListItem[];
};

export function useArtwork(id: string) {
  const { getToken } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  const { data: artworkData, isLoading: isLoadingArtwork, error: artworkError } = useQuery({
    queryKey: ['artworks', 'detail', id],
    queryFn: () => apiClient.get<ArtworkDetailResponse>(E.artworks.byId(id)),
    enabled: !!id,
    select: res => res.data,
  });

  const { data: relatedData, isLoading: isLoadingRelated } = useQuery({
    queryKey: ['artworks', id, 'related'],
    queryFn: () => apiClient.get<RelatedArtworksResponse>(E.artworks.related(id)),
    enabled: !!artworkData,
    select: res => res.data,
  });

  return {
    artwork: artworkData ?? null,
    relatedArtworks: relatedData ?? [],
    isLoading: isLoadingArtwork,
    isLoadingRelated,
    error: artworkError,
  };
}

export function useArtworks({ limit = 25 }: { limit?: number } = {}) {
  const { getToken } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['artworks', 'list', limit],
    queryFn: ({ pageParam = 0 }) =>
      apiClient.get<ArtworksListResponse>(E.artworks.list(limit, pageParam as number)),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      return lastPage.data.length;
    },
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

export function useMyArtworks() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  return useQuery({
    queryKey: ['artworks', 'mine'],
    queryFn: () => apiClient.get<ArtworksListResponse>(E.artworks.byUser()),
    enabled: !!isSignedIn,
    select: res => res.data,
  });
}
