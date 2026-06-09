import { useAuth } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
};

type NotificationsResponse = {
  items: Notification[];
  unreadCount: number;
};

export function useNotifications() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get<NotificationsResponse>(E.notifications.list(30)),
    enabled: !!isSignedIn,
    refetchInterval: 30_000,
    staleTime: 60 * 1000,
  });

  const markRead = useCallback(async (id: string) => {
    await apiClient.patch<void>(E.notifications.markRead(id));
    queryClient.setQueryData<NotificationsResponse>(['notifications'], (prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        items: prev.items.map(n => (n.id === id ? { ...n, isRead: true } : n)),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      };
    });
  }, [queryClient]);

  const markAllRead = useCallback(async () => {
    await apiClient.patch<void>(E.notifications.markAllRead());
    queryClient.setQueryData<NotificationsResponse>(['notifications'], (prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        items: prev.items.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      };
    });
  }, [queryClient]);

  const deleteMutation = useCallback(async (id: string) => {
    const prev = queryClient.getQueryData<NotificationsResponse>(['notifications']);
    await apiClient.delete<void>(E.notifications.delete(id));
    queryClient.setQueryData<NotificationsResponse>(['notifications'], (current) => {
      if (!current) {
        return current;
      }
      const wasUnread = prev?.items.find(n => n.id === id && !n.isRead);
      return {
        ...current,
        items: current.items.filter(n => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, current.unreadCount - 1) : current.unreadCount,
      };
    });
  }, [queryClient]);

  return {
    notifications: data?.items ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    markRead,
    markAllRead,
    deleteNotification: deleteMutation,
  };
}
