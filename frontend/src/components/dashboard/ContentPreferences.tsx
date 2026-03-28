'use client';

import {
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  Stack,
  Switch,
  TagsInput,
  Text,
  Title,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconBook,
  IconBrush,
  IconCamera,
  IconRobot,
} from '@tabler/icons-react';
import { useState } from 'react';

type ContentPreferencesData = {
  contentTypes: {
    illustrations: boolean;
    manga: boolean;
    photography: boolean;
    aiGenerated: boolean;
    showLessAI: boolean;
  };
  mutedTags: string[];
  browsingHistory: {
    recordViewed: boolean;
  };
  sensitiveContent: {
    showR18: boolean;
    showR18G: boolean;
  };
};

const defaultData: ContentPreferencesData = {
  contentTypes: {
    illustrations: true,
    manga: true,
    photography: false,
    aiGenerated: false,
    showLessAI: false,
  },
  mutedTags: ['#politics', '#horror', '#spoilers'],
  browsingHistory: {
    recordViewed: true,
  },
  sensitiveContent: {
    showR18: false,
    showR18G: false,
  },
};

export function ContentPreferences() {
  const [data, setData] = useState<ContentPreferencesData>(defaultData);

  const updateContentType = (key: keyof ContentPreferencesData['contentTypes'], value: boolean) => {
    setData(prev => ({
      ...prev,
      contentTypes: { ...prev.contentTypes, [key]: value },
    }));
  };

  const updateSensitive = (key: keyof ContentPreferencesData['sensitiveContent'], value: boolean) => {
    setData(prev => ({
      ...prev,
      sensitiveContent: { ...prev.sensitiveContent, [key]: value },
    }));
  };

  return (
    <Stack gap="xl">
      {/* Page Header */}
      <Box pb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
        <Title order={2} mb="xs">
          Content Preferences
        </Title>
        <Text c="dimmed" size="sm">
          Customize your feed, filters, and browsing experience.
        </Text>
      </Box>

      {/* Content Types */}
      <Card withBorder radius="lg" p="lg">
        <Title order={4} mb="xs">
          Content Types
        </Title>
        <Text c="dimmed" size="sm" mb="lg">
          Choose what type of artworks appear in your home feed and search results.
        </Text>

        <Stack gap="md">
          {/* Illustrations */}
          <Group justify="space-between" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-1)' }}>
            <Group gap="sm">
              <IconBrush size={20} color="var(--mantine-color-gray-5)" />
              <Text fw={500}>Illustrations</Text>
            </Group>
            <Switch
              checked={data.contentTypes.illustrations}
              onChange={e => updateContentType('illustrations', e.currentTarget.checked)}
              color="primary"
            />
          </Group>

          {/* Manga & Comics */}
          <Group justify="space-between" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-1)' }}>
            <Group gap="sm">
              <IconBook size={20} color="var(--mantine-color-gray-5)" />
              <Text fw={500}>Manga & Comics</Text>
            </Group>
            <Switch
              checked={data.contentTypes.manga}
              onChange={e => updateContentType('manga', e.currentTarget.checked)}
              color="primary"
            />
          </Group>

          {/* Photography / Cosplay */}
          <Group justify="space-between" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-1)' }}>
            <Group gap="sm">
              <IconCamera size={20} color="var(--mantine-color-gray-5)" />
              <Text fw={500}>Photography / Cosplay</Text>
            </Group>
            <Switch
              checked={data.contentTypes.photography}
              onChange={e => updateContentType('photography', e.currentTarget.checked)}
              color="primary"
            />
          </Group>

          {/* AI-Generated Content Box */}
          <Box
            p="md"
            style={{
              backgroundColor: 'var(--mantine-color-indigo-0)',
              borderRadius: 'var(--mantine-radius-md)',
              border: '1px solid var(--mantine-color-indigo-2)',
            }}
          >
            <Group justify="space-between" mb="sm">
              <Group gap="sm">
                <IconRobot size={20} color="var(--mantine-color-indigo-6)" />
                <Box>
                  <Text fw={600} c="indigo.9">Show AI-Generated Content</Text>
                  <Text size="xs" c="indigo.6">Artworks created using generative AI tools.</Text>
                </Box>
              </Group>
              <Switch
                checked={data.contentTypes.aiGenerated}
                onChange={e => updateContentType('aiGenerated', e.currentTarget.checked)}
                color="indigo"
              />
            </Group>
            <Box pt="sm" style={{ borderTop: '1px solid var(--mantine-color-indigo-2)' }}>
              <Checkbox
                label="Show less AI content in recommendations (Enable above to configure)"
                disabled={!data.contentTypes.aiGenerated}
                checked={data.contentTypes.showLessAI}
                onChange={e => updateContentType('showLessAI', e.currentTarget.checked)}
                size="sm"
              />
            </Box>
          </Box>
        </Stack>
      </Card>

      {/* Muted Tags */}
      <Card withBorder radius="lg" p="lg">
        <Title order={4} mb="xs">
          Muted Tags
        </Title>
        <Text c="dimmed" size="sm" mb="lg">
          Artworks containing these tags will be hidden from your search results and home feed.
        </Text>

        <TagsInput
          placeholder="Add a tag to mute..."
          value={data.mutedTags}
          onChange={tags => setData(prev => ({ ...prev, mutedTags: tags }))}
          leftSection={<Text c="dimmed" size="sm">#</Text>}
        />
      </Card>

      {/* Browsing History */}
      <Card withBorder radius="lg" p="lg">
        <Group justify="space-between" align="flex-start" mb="md">
          <Box>
            <Title order={4} mb="xs">
              Browsing History
            </Title>
            <Text c="dimmed" size="sm">
              Manage how your viewing activity is stored.
            </Text>
          </Box>
          <Button variant="subtle" color="red" size="xs">
            Clear History
          </Button>
        </Group>

        <Box
          p="md"
          style={{
            backgroundColor: 'var(--mantine-color-gray-0)',
            borderRadius: 'var(--mantine-radius-md)',
          }}
        >
          <Group justify="space-between">
            <Box>
              <Text fw={500}>Record Viewed Artworks</Text>
              <Text size="sm" c="dimmed" mt={4}>
                Allows you to find previously viewed artworks in your history tab.
              </Text>
            </Box>
            <Switch
              checked={data.browsingHistory.recordViewed}
              onChange={e => setData(prev => ({
                ...prev,
                browsingHistory: { recordViewed: e.currentTarget.checked },
              }))}
              color="primary"
            />
          </Group>
        </Box>
      </Card>

      {/* Sensitive Content Settings */}
      <Card
        withBorder
        radius="lg"
        p="lg"
        style={{
          backgroundColor: 'var(--mantine-color-red-0)',
          borderColor: 'var(--mantine-color-red-2)',
        }}
      >
        <Group gap="md" align="flex-start">
          <Box
            p="sm"
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--mantine-radius-md)',
            }}
          >
            <IconAlertTriangle size={24} color="var(--mantine-color-red-6)" />
          </Box>
          <Box flex={1}>
            <Title order={4} mb="xs">
              Sensitive Content Settings
            </Title>
            <Text c="dimmed" size="sm" mb="lg">
              Control visibility of age-restricted (R-18) content. You must be 18+.
            </Text>

            <Stack gap="sm">
              <Group justify="space-between" py="xs">
                <Text fw={500}>Show R-18 Content</Text>
                <Switch
                  checked={data.sensitiveContent.showR18}
                  onChange={e => updateSensitive('showR18', e.currentTarget.checked)}
                  color="red"
                />
              </Group>
              <Group justify="space-between" py="xs">
                <Text fw={500}>Show R-18G (Grotesque) Content</Text>
                <Switch
                  checked={data.sensitiveContent.showR18G}
                  onChange={e => updateSensitive('showR18G', e.currentTarget.checked)}
                  color="red"
                />
              </Group>
            </Stack>
          </Box>
        </Group>
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
