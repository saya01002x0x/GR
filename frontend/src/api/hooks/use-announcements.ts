import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'MAINTENANCE';
};

const DISMISSED_KEY = 'dismissed_announcements';

function getDismissedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function useAnnouncements() {
  const [dismissed, setDismissed] = useState<string[]>(() => getDismissedIds());

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: () => apiClient.get<Announcement[]>(E.announcements.active()),
    select: res => res.filter(a => !dismissed.includes(a.id)),
  });

  const dismiss = (id: string) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(newDismissed));
  };

  return {
    announcements: data ?? [],
    isLoading,
    dismiss,
  };
}
