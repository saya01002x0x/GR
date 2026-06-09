'use client';

import {
  Box,
  Card,
  Grid,
  Group,
  Loader,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { IconWorld } from '@tabler/icons-react';
import { useNotificationPreferences } from '@/api/hooks';

export function NotificationSettings() {
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences();

  if (isLoading) {
    return <Box ta="center" py="xl"><Loader /></Box>;
  }

  const prefs = preferences || {
    followWeb: true,
    likeWeb: true,
    commentWeb: true,
    mentionWeb: true,
    newArtworkWeb: true,
    weeklyNewsletter: true,
    productUpdates: true,
  };

  const updatePrefs = (key: string, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  return (
    <Stack gap="xl">
      <Box pb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
        <Title order={2} mb="xs">
          Notification Settings
        </Title>
        <Text c="dimmed" size="sm">
          Choose what you want to be notified about.
        </Text>
      </Box>

      <Card withBorder radius="lg" p="lg">
        <Box mb="lg">
          <Title order={4} mb="xs">
            Activity
          </Title>
          <Text c="dimmed" size="sm">
            Alerts about interactions with your content and profile.
          </Text>
        </Box>

        <Grid pb="sm" mb="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
          <Grid.Col span={9}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Type
            </Text>
          </Grid.Col>
          <Grid.Col span={3}>
            <Group justify="center" gap={4}>
              <IconWorld size={14} color="var(--mantine-color-gray-5)" />
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" visibleFrom="sm">
                Web Push
              </Text>
            </Group>
          </Grid.Col>
        </Grid>

        <Stack gap={0}>
          {[
            { key: 'followWeb', label: 'New Followers', desc: 'When someone starts following your profile.' },
            { key: 'likeWeb', label: 'Artwork Likes', desc: 'When someone likes one of your illustrations.' },
            { key: 'commentWeb', label: 'Comments', desc: 'When someone comments on your work.' },
            { key: 'mentionWeb', label: 'Mentions & Tags', desc: 'When you are mentioned.' },
            { key: 'newArtworkWeb', label: 'New Artworks', desc: 'When someone you follow uploads new artwork.' },
          ].map((item, index, arr) => (
            <Grid
              key={item.key}
              py="md"
              px="xs"
              style={{
                borderBottom: index < arr.length - 1 ? '1px solid var(--mantine-color-gray-1)' : undefined,
                borderRadius: 'var(--mantine-radius-sm)',
              }}
            >
              <Grid.Col span={9}>
                <Text fw={500} size="sm">{item.label}</Text>
                <Text size="xs" c="dimmed" mt={2}>{item.desc}</Text>
              </Grid.Col>
              <Grid.Col span={3}>
                <Group justify="center" h="100%" align="center">
                  <Switch
                    size="sm"
                    checked={(prefs as any)[item.key]}
                    onChange={e => updatePrefs(item.key, e.currentTarget.checked)}
                    color="primary"
                    disabled={isUpdating}
                  />
                </Group>
              </Grid.Col>
            </Grid>
          ))}
        </Stack>
      </Card>

      <Card withBorder radius="lg" p="lg">
        <Box mb="lg">
          <Title order={4} mb="xs">
            Updates & News
          </Title>
        </Box>
        <Stack gap="md">
          <Group justify="space-between" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-1)' }}>
            <Box>
              <Text fw={500}>Weekly Newsletter</Text>
              <Text size="sm" c="dimmed">Best artwork of the week.</Text>
            </Box>
            <Switch
              checked={prefs.weeklyNewsletter}
              onChange={e => updatePrefs('weeklyNewsletter', e.currentTarget.checked)}
              color="primary"
              disabled={isUpdating}
            />
          </Group>
          <Group justify="space-between" py="sm">
            <Box>
              <Text fw={500}>Product Updates</Text>
              <Text size="sm" c="dimmed">New features and news.</Text>
            </Box>
            <Switch
              checked={prefs.productUpdates}
              onChange={e => updatePrefs('productUpdates', e.currentTarget.checked)}
              color="primary"
              disabled={isUpdating}
            />
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
