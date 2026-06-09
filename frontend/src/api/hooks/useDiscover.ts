import type { ArtworkDetail, ArtworkListItem } from '@/types/artwork';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { E } from '../endpoints';

// Replace with actual types if available
export type FeaturedItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  tag?: { label: string; color: string };
  artwork?: ArtworkListItem;
};

export function useDiscoverHero() {
  return useQuery({
    queryKey: ['discover', 'hero'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: FeaturedItem[] }>(E.discover.hero());
      return res.data;
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function useFeaturedArtworks() {
  return useQuery({
    queryKey: ['discover', 'featured'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ArtworkDetail[] }>(E.discover.featured());
      return res.data;
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function useRanking(timeframe: 'daily' | 'weekly' | 'monthly' | 'rookie' = 'daily') {
  return useQuery({
    queryKey: ['ranking', timeframe],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ArtworkListItem[] }>(E.discover.ranking(timeframe));
      return res.data;
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function useRisingStars() {
  return useQuery({
    queryKey: ['discover', 'risingStars'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: any[] }>(E.discover.risingStars());
      return res.data;
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function usePopularTags() {
  return useQuery({
    queryKey: ['discover', 'popularTags'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: string[] }>(E.discover.popularTags());
      return res.data;
    },
    staleTime: 15 * 60 * 1000,
  });
}
