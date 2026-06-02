'use client';

import { Alert, CloseButton, Group, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconInfoCircle, IconTool } from '@tabler/icons-react';
import { useAnnouncements } from '@/api/hooks';

const TYPE_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  INFO: { color: 'blue', icon: IconInfoCircle },
  WARNING: { color: 'orange', icon: IconAlertTriangle },
  MAINTENANCE: { color: 'red', icon: IconTool },
};

export function AnnouncementBanner() {
  const { announcements, dismiss } = useAnnouncements();

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
