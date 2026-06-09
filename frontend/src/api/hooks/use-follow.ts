import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

type FollowStatusResponse = {
  isFollowing: boolean;
  followerCount: number;
};

type ToggleFollowResponse = {
  followed: boolean;
  followerCount: number;
};

export function useFollow(userId: string) {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  const queryKey = ['follows', userId, 'status'];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => apiClient.get<FollowStatusResponse>(E.follows.status(userId)),
    enabled: !!isSignedIn && !!userId,
    staleTime: 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: () => apiClient.post<ToggleFollowResponse>(E.follows.toggle(userId)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previousStatus = queryClient.getQueryData<FollowStatusResponse>(queryKey);

      if (previousStatus) {
        queryClient.setQueryData<FollowStatusResponse>(queryKey, {
          isFollowing: !previousStatus.isFollowing,
          followerCount: previousStatus.isFollowing
            ? Math.max(0, previousStatus.followerCount - 1)
            : previousStatus.followerCount + 1,
        });
      } else {
        queryClient.setQueryData<FollowStatusResponse>(queryKey, {
          isFollowing: true,
          followerCount: 1,
        });
      }

      return { previousStatus };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(queryKey, context.previousStatus);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['artists', userId] });
      queryClient.invalidateQueries({ queryKey: ['artworks', 'user', userId] });
    },
  });

  return {
    isFollowing: data?.isFollowing ?? false,
    followerCount: data?.followerCount ?? 0,
    isLoading,
    toggleFollow: () => mutation.mutate(),
    isToggling: mutation.isPending,
  };
}
