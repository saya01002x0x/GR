'use client';

import { Alert, CloseButton, Group, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconInfoCircle, IconTool } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'MAINTENANCE';
};

const TYPE_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  INFO: { color: 'blue', icon: IconInfoCircle },
  WARNING: { color: 'orange', icon: IconAlertTriangle },
  MAINTENANCE: { color: 'red', icon: IconTool },
};

const DISMISSED_KEY = 'dismissed_announcements';

function getDismissedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_URL}/announcements/active`);
        if (res.ok && !cancelled) {
          const data: Announcement[] = await res.json();
          const dismissed = getDismissedIds();
          setAnnouncements(data.filter(a => !dismissed.includes(a.id)));
        }
      } catch { /* ignore */ }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = (id: string) => {
    const dismissed = getDismissedIds();
    dismissed.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  if (announcements.length === 0) {
    return null;
  }

  return (
    <Stack gap={4} px="md" pt="xs">
      {announcements.map((ann) => {
        const config = TYPE_CONFIG[ann.type] ?? TYPE_CONFIG.INFO;
        const Icon = config!.icon;
        return (
          <Alert key={ann.id} color={config!.color} variant="light" radius="md" p="xs">
            <Group justify="space-between" wrap="nowrap">
              <Group gap="xs" wrap="nowrap">
                <Icon size={16} />
                <Text size="sm" fw={600}>{ann.title}</Text>
                <Text size="sm" c="dimmed">{ann.content}</Text>
              </Group>
              <CloseButton size="sm" onClick={() => dismiss(ann.id)} />
            </Group>
          </Alert>
        );
      })}
    </Stack>
  );
}
