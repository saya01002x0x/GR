import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

type NotificationPreferences = {
  followWeb: boolean;
  likeWeb: boolean;
  commentWeb: boolean;
  mentionWeb: boolean;
  newArtworkWeb: boolean;
  weeklyNewsletter: boolean;
  productUpdates: boolean;
};

export function useNotificationPreferences() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  const queryKey = ['notifications', 'preferences'];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => apiClient.get<NotificationPreferences>(E.notifications.preferences()),
    enabled: !!isSignedIn,
  });

  const mutation = useMutation({
    mutationFn: (newPrefs: Partial<NotificationPreferences>) =>
      apiClient.patch<NotificationPreferences>(E.notifications.preferences(), newPrefs),
    onMutate: async (newPrefs) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NotificationPreferences>(queryKey);
      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(queryKey, {
          ...previous,
          ...newPrefs,
        });
      }
      return { previous };
    },
    onError: (_err, _newPrefs, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    preferences: data,
    isLoading,
    updatePreferences: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
