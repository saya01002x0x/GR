import { useAuth } from '@clerk/nextjs';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

type FeedResponse = {
  items: any[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export function useFollowingFeed(limit = 24) {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  return useInfiniteQuery({
    queryKey: ['follows', 'feed', limit],
    queryFn: async ({ pageParam = 1 }) => {
      return apiClient.get<FeedResponse>(E.follows.feed(pageParam as number, limit));
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!isSignedIn,
  });
}
