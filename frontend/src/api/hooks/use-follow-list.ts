import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

type UserSummary = {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  isArtist: boolean;
  _count: {
    followers: number;
    artworks: number;
  };
};

type FollowListResponse = {
  items: UserSummary[];
  total: number;
  page: number;
  limit: number;
};

export function useFollowList(type: 'followers' | 'following', page = 1, limit = 20) {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  const endpoint = type === 'followers'
    ? E.follows.myFollowers(page, limit)
    : E.follows.myFollowing(page, limit);

  return useQuery({
    queryKey: ['follows', type, page, limit],
    queryFn: () => apiClient.get<FollowListResponse>(endpoint),
    enabled: !!isSignedIn,
    placeholderData: prev => prev,
  });
}
