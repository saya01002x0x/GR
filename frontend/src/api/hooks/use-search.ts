import type { SearchResponse } from '@gr/shared';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

export function useSearchArtworks(params: URLSearchParams) {
  const { getToken } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  return useQuery({
    queryKey: ['search', params.toString()],
    queryFn: () => apiClient.get<SearchResponse>(E.search.artworks(params)),
    staleTime: 1000 * 60,
  });
}
