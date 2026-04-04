import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

type UserProfile = {
  id: string;
  role: string;
  isArtist: boolean;
  warningCount?: number;
  isBanned?: boolean;
  bannedUntil?: string | null;
};

export function useUserProfile() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => apiClient.get<UserProfile>(E.users.me()),
    enabled: !!isSignedIn,
  });
}
