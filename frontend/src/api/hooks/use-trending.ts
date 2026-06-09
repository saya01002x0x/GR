import type { Artwork } from '@gr/shared';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

type ArtworksResponse = { data: Artwork[] };

export function useTrendingArtworks(limit = 4) {
  const { getToken } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  return useQuery({
    queryKey: ['artworks', 'popular', limit],
    queryFn: () => apiClient.get<ArtworksResponse>(E.artworks.popular(limit)),
    select: data => data.data,
    staleTime: 15 * 60 * 1000,
  });
}
