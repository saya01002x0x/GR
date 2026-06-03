import type { Artist } from '@gr/shared';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

type ArtistsResponse = { data: Artist[] };

export function useFeaturedArtists() {
  const { getToken } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  return useQuery({
    queryKey: ['users', 'artists'],
    queryFn: () => apiClient.get<ArtistsResponse>(E.users.artists()),
    select: data => data.data,
  });
}
