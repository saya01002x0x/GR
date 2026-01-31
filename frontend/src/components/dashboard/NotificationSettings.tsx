'use client';

import {
  Box,
  Button,
  Card,
  Grid,
  Group,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { IconMail, IconWorld } from '@tabler/icons-react';
import { useState } from 'react';

type NotificationData = {
  activity: {
    newFollowers: { email: boolean; web: boolean };
    artworkLikes: { email: boolean; web: boolean };
    comments: { email: boolean; web: boolean };
    mentions: { email: boolean; web: boolean };
  };
  updates: {
    weeklyNewsletter: boolean;
    productUpdates: boolean;
  };
};

const defaultData: NotificationData = {
  activity: {
    newFollowers: { email: true, web: true },
    artworkLikes: { email: false, web: true },
    comments: { email: true, web: true },
    mentions: { email: false, web: true },
  },
  updates: {
    weeklyNewsletter: true,
    productUpdates: true,
  },
};

type ActivityKey = keyof NotificationData['activity'];

const activityItems: { key: ActivityKey; label: string; description: string }[] = [
  { key: 'newFollowers', label: 'New Followers', description: 'When someone starts following your profile.' },
  { key: 'artworkLikes', label: 'Artwork Likes', description: 'When someone likes one of your illustrations.' },
  { key: 'comments', label: 'Comments', description: 'When someone comments on your work.' },
  { key: 'mentions', label: 'Mentions & Tags', description: 'When you are mentioned in a description or comment.' },
];

export function NotificationSettings() {
  const [data, setData] = useState<NotificationData>(defaultData);

  const updateActivity = (key: ActivityKey, type: 'email' | 'web', value: boolean) => {
    setData(prev => ({
      ...prev,
      activity: {
        ...prev.activity,
        [key]: { ...prev.activity[key], [type]: value },
      },
    }));
  };

  const updateUpdates = (key: keyof NotificationData['updates'], value: boolean) => {
    setData(prev => ({
      ...prev,
      updates: { ...prev.updates, [key]: value },
    }));
  };

  return (
    <Stack gap="xl">
      {/* Page Header */}
      <Box pb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
        <Title order={2} mb="xs">
          Notification Settings
        </Title>
        <Text c="dimmed" size="sm">
          Choose what you want to be notified about and how you receive alerts.
        </Text>
      </Box>

      {/* Activity Notifications */}
      <Card withBorder radius="lg" p="lg">
        <Box mb="lg">
          <Title order={4} mb="xs">
            Activity
          </Title>
          <Text c="dimmed" size="sm">
            Alerts about interactions with your content and profile.
          </Text>
        </Box>

        {/* Header Row */}
        <Grid pb="sm" mb="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
          <Grid.Col span={8}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Type
            </Text>
          </Grid.Col>
          <Grid.Col span={2}>
            <Group justify="center" gap={4}>
              <IconMail size={14} color="var(--mantine-color-gray-5)" />
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" visibleFrom="sm">
                Email
              </Text>
            </Group>
          </Grid.Col>
          <Grid.Col span={2}>
            <Group justify="center" gap={4}>
              <IconWorld size={14} color="var(--mantine-color-gray-5)" />
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" visibleFrom="sm">
                Web
              </Text>
            </Group>
          </Grid.Col>
        </Grid>

        {/* Notification Rows */}
        <Stack gap={0}>
          {activityItems.map((item, index) => (
            <Grid
              key={item.key}
              py="md"
              px="xs"
              style={{
                borderBottom: index < activityItems.length - 1 ? '1px solid var(--mantine-color-gray-1)' : undefined,
                borderRadius: 'var(--mantine-radius-sm)',
                transition: 'background-color 0.15s',
              }}
              styles={{
                root: {
                  '&:hover': {
                    backgroundColor: 'var(--mantine-color-gray-0)',
                  },
                },
              }}
            >
              <Grid.Col span={8}>
                <Text fw={500} size="sm">{item.label}</Text>
                <Text size="xs" c="dimmed" mt={2}>{item.description}</Text>
              </Grid.Col>
              <Grid.Col span={2}>
                <Group justify="center" h="100%" align="center">
                  <Switch
                    size="sm"
                    checked={data.activity[item.key].email}
                    onChange={e => updateActivity(item.key, 'email', e.currentTarget.checked)}
                    color="primary"
                  />
                </Group>
              </Grid.Col>
              <Grid.Col span={2}>
                <Group justify="center" h="100%" align="center">
                  <Switch
                    size="sm"
                    checked={data.activity[item.key].web}
                    onChange={e => updateActivity(item.key, 'web', e.currentTarget.checked)}
                    color="primary"
                  />
                </Group>
              </Grid.Col>
            </Grid>
          ))}
        </Stack>
      </Card>

      {/* Updates & News */}
      <Card withBorder radius="lg" p="lg">
        <Box mb="lg">
          <Title order={4} mb="xs">
            Updates & News
          </Title>
          <Text c="dimmed" size="sm">
            Stay up to date with ArtShare.
          </Text>
        </Box>

        <Stack gap="md">
          <Group
            justify="space-between"
            py="sm"
            style={{ borderBottom: '1px solid var(--mantine-color-gray-1)' }}
          >
            <Box>
              <Text fw={500}>Weekly Newsletter</Text>
              <Text size="sm" c="dimmed">Best artwork of the week, curated for you.</Text>
            </Box>
            <Switch
              checked={data.updates.weeklyNewsletter}
              onChange={e => updateUpdates('weeklyNewsletter', e.currentTarget.checked)}
              color="primary"
            />
          </Group>

          <Group justify="space-between" py="sm">
            <Box>
              <Text fw={500}>Product Updates</Text>
              <Text size="sm" c="dimmed">New features, improvements, and community news.</Text>
            </Box>
            <Switch
              checked={data.updates.productUpdates}
              onChange={e => updateUpdates('productUpdates', e.currentTarget.checked)}
              color="primary"
            />
          </Group>
        </Stack>
      </Card>

      {/* Save Buttons */}
      <Group justify="flex-end" gap="md">
        <Button variant="default" size="md">
          Cancel
        </Button>
        <Button size="md">
          Save Changes
        </Button>
      </Group>
    </Stack>
  );
}
