'use client';

import type { UserProfile } from '@/mocks/dashboardData';
import {
  Alert,
  Card,
  Group,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

type SensitiveContentProps = {
  settings: UserProfile['sensitiveContent'];
  onChange: (settings: UserProfile['sensitiveContent']) => void;
};

export function SensitiveContent({ settings, onChange }: SensitiveContentProps) {
  const handleToggle = (key: keyof UserProfile['sensitiveContent']) => {
    onChange({ ...settings, [key]: !settings[key] });
  };

  return (
    <Card withBorder radius="lg" p="lg" bd="1px solid var(--mantine-color-red-3)">
      <Title order={4} mb="md" c="red">
        Sensitive Content Settings
      </Title>

      <Alert
        icon={<IconAlertTriangle size={18} />}
        color="red"
        variant="light"
        mb="lg"
      >
        <Text size="sm">
          You must be 18 years or older to enable these settings. Content marked as R-18 may contain mature themes.
        </Text>
      </Alert>

      <Stack gap="lg">
        <Group justify="space-between" wrap="nowrap">
          <div>
            <Text size="sm" fw={500}>
              Show R-18 Content
            </Text>
            <Text size="xs" c="dimmed">
              Display artworks marked as adult content
            </Text>
          </div>
          <Switch
            checked={settings.showR18}
            onChange={() => handleToggle('showR18')}
            color="red"
          />
        </Group>

        <Group justify="space-between" wrap="nowrap">
          <div>
            <Text size="sm" fw={500}>
              Show R-18G (Grotesque) Content
            </Text>
            <Text size="xs" c="dimmed">
              Display artworks containing graphic or disturbing imagery
            </Text>
          </div>
          <Switch
            checked={settings.showR18G}
            onChange={() => handleToggle('showR18G')}
            color="red"
          />
        </Group>
      </Stack>
    </Card>
  );
}
