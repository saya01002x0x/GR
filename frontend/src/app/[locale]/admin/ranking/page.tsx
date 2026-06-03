'use client';

import {
  Button,
  Card,
  Code,
  Group,
  Loader,
  Slider,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useAdminRanking } from '@/api/hooks';

const DEFAULT_WEIGHTS = {
  likeWeight: 3,
  viewWeight: 1,
  commentWeight: 5,
  bookmarkWeight: 4,
  timeDecayFactor: 1.2,
};

export default function RankingPage() {
  const { weights, isLoading, saveWeights } = useAdminRanking();
  const [pending, setPending] = useState<Partial<typeof DEFAULT_WEIGHTS>>({});

  if (isLoading) {
    return <Loader />;
  }

  const localWeights = {
    ...DEFAULT_WEIGHTS,
    ...weights,
    ...pending,
  };

  const updateField = <K extends keyof typeof DEFAULT_WEIGHTS>(key: K, value: (typeof DEFAULT_WEIGHTS)[K]) => {
    setPending(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await saveWeights(localWeights);
      setPending({});
      notifications.show({ message: 'Ranking weights saved', color: 'green' });
    } catch {
      notifications.show({ message: 'Failed to save', color: 'red' });
    }
  };

  return (
    <Stack gap="lg">
      <Title order={2}>Dynamic Ranking</Title>

      <Card withBorder p="lg" radius="md">
        <Title order={4} mb="md">Trending Score Formula</Title>
        <Code block>
          Score = (wL × Likes + wV × Views + wC × Comments + wB × Bookmarks) / (Hours + 2)^Decay
        </Code>
      </Card>

      <Card withBorder p="lg" radius="md">
        <Stack gap="lg">
          <div>
            <Group justify="space-between" mb={4}>
              <Text size="sm" fw={500}>Like Weight (wL)</Text>
              <Text size="sm" c="dimmed">{localWeights.likeWeight}</Text>
            </Group>
            <Slider min={1} max={10} value={localWeights.likeWeight} onChange={v => updateField('likeWeight', v)} />
          </div>

          <div>
            <Group justify="space-between" mb={4}>
              <Text size="sm" fw={500}>View Weight (wV)</Text>
              <Text size="sm" c="dimmed">{localWeights.viewWeight}</Text>
            </Group>
            <Slider min={1} max={10} value={localWeights.viewWeight} onChange={v => updateField('viewWeight', v)} />
          </div>

          <div>
            <Group justify="space-between" mb={4}>
              <Text size="sm" fw={500}>Comment Weight (wC)</Text>
              <Text size="sm" c="dimmed">{localWeights.commentWeight}</Text>
            </Group>
            <Slider min={1} max={10} value={localWeights.commentWeight} onChange={v => updateField('commentWeight', v)} />
          </div>

          <div>
            <Group justify="space-between" mb={4}>
              <Text size="sm" fw={500}>Bookmark Weight (wB)</Text>
              <Text size="sm" c="dimmed">{localWeights.bookmarkWeight}</Text>
            </Group>
            <Slider min={1} max={10} value={localWeights.bookmarkWeight} onChange={v => updateField('bookmarkWeight', v)} />
          </div>

          <div>
            <Group justify="space-between" mb={4}>
              <Text size="sm" fw={500}>Time Decay Factor</Text>
              <Text size="sm" c="dimmed">{localWeights.timeDecayFactor.toFixed(1)}</Text>
            </Group>
            <Slider min={0.5} max={2.0} step={0.1} value={localWeights.timeDecayFactor} onChange={v => updateField('timeDecayFactor', v)} />
          </div>
        </Stack>
      </Card>

      <Group justify="flex-end">
        <Button variant="default" onClick={() => setPending({})}>Reset to Defaults</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </Group>
    </Stack>
  );
}
