'use client';

import { useAuth } from '@clerk/nextjs';
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
import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type RankingWeights = {
  likeWeight: number;
  viewWeight: number;
  commentWeight: number;
  bookmarkWeight: number;
  timeDecayFactor: number;
};

const DEFAULT_WEIGHTS: RankingWeights = {
  likeWeight: 3,
  viewWeight: 1,
  commentWeight: 5,
  bookmarkWeight: 4,
  timeDecayFactor: 1.2,
};

export default function RankingPage() {
  const { getToken } = useAuth();
  const [weights, setWeights] = useState<RankingWeights>(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchWeights = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/admin/ranking/weights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWeights({ ...DEFAULT_WEIGHTS, ...data });
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchWeights();
  }, [fetchWeights]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/admin/ranking/weights`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(weights),
      });
      if (res.ok) {
        notifications.show({ message: 'Ranking weights saved', color: 'green' });
      }
    } catch {
      notifications.show({ message: 'Failed to save', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

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
              <Text size="sm" c="dimmed">{weights.likeWeight}</Text>
            </Group>
            <Slider min={1} max={10} value={weights.likeWeight} onChange={v => setWeights(w => ({ ...w, likeWeight: v }))} />
          </div>

          <div>
            <Group justify="space-between" mb={4}>
              <Text size="sm" fw={500}>View Weight (wV)</Text>
              <Text size="sm" c="dimmed">{weights.viewWeight}</Text>
            </Group>
            <Slider min={1} max={10} value={weights.viewWeight} onChange={v => setWeights(w => ({ ...w, viewWeight: v }))} />
          </div>

          <div>
            <Group justify="space-between" mb={4}>
              <Text size="sm" fw={500}>Comment Weight (wC)</Text>
              <Text size="sm" c="dimmed">{weights.commentWeight}</Text>
            </Group>
            <Slider min={1} max={10} value={weights.commentWeight} onChange={v => setWeights(w => ({ ...w, commentWeight: v }))} />
          </div>

          <div>
            <Group justify="space-between" mb={4}>
              <Text size="sm" fw={500}>Bookmark Weight (wB)</Text>
              <Text size="sm" c="dimmed">{weights.bookmarkWeight}</Text>
            </Group>
            <Slider min={1} max={10} value={weights.bookmarkWeight} onChange={v => setWeights(w => ({ ...w, bookmarkWeight: v }))} />
          </div>

          <div>
            <Group justify="space-between" mb={4}>
              <Text size="sm" fw={500}>Time Decay Factor</Text>
              <Text size="sm" c="dimmed">{weights.timeDecayFactor.toFixed(1)}</Text>
            </Group>
            <Slider min={0.5} max={2.0} step={0.1} value={weights.timeDecayFactor} onChange={v => setWeights(w => ({ ...w, timeDecayFactor: v }))} />
          </div>
        </Stack>
      </Card>

      <Group justify="flex-end">
        <Button variant="default" onClick={() => setWeights(DEFAULT_WEIGHTS)}>Reset to Defaults</Button>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </Group>
    </Stack>
  );
}
