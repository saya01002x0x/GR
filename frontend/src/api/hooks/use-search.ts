import type { SearchResponse } from '@gr/shared';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

export function useSearchArtworks(params: URLSearchParams) {
  const { getToken } = useAuth();
  const searchParams = new URLSearchParams(params.toString());
  searchParams.delete('mode');

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  return useQuery({
    queryKey: ['search', searchParams.toString()],
    queryFn: () => apiClient.get<SearchResponse>(E.search.artworks(searchParams)),
    staleTime: 15 * 60 * 1000,
  });
}

// AI Semantic Text Search
export function useAiSearchText(query: string, limit: number = 20, enabled: boolean = true) {
  const { getToken } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  return useQuery({
    queryKey: ['ai-search-text', query, limit],
    queryFn: async () => {
      if (!query) {
        return { hits: [], total: 0, processingTimeMs: 0 } as unknown as SearchResponse;
      }
      const res = await apiClient.get<{ results: any[]; total: number; processingTimeMs?: number }>(`${E.aiSearch.text(query)}&limit=${limit}`);
      // Map results to match the format of Meilisearch 'SearchResponse'
      return {
        hits: res.results || [],
        total: res.total || 0,
        processingTimeMs: res.processingTimeMs || 0,
      } as unknown as SearchResponse;
    },
    enabled: enabled && !!query,
    staleTime: 15 * 60 * 1000,
  });
}

// AI Sketch Search
export function useAiSearchSketch() {
  const { getToken } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  return useMutation({
    mutationFn: async (base64Image: string) => {
      const res = await apiClient.post<{ results: any[]; total: number; processingTimeMs?: number }>(E.aiSearch.sketch(), {
        image: base64Image,
        limit: 20,
      });
      // Map results to match SearchResponse format
      return {
        hits: res.results || [],
        total: res.total || 0,
        processingTimeMs: res.processingTimeMs || 0,
      } as unknown as SearchResponse;
    },
  });
}
