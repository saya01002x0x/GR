'use client';

import { useAuth } from '@clerk/nextjs';
import { Card, Grid, Group, Loader, Stack, Text, Title } from '@mantine/core';
import {
  IconArtboard,
  IconEye,
  IconHeart,
  IconUsers,
} from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Overview = {
  totalUsers: number;
  totalArtworks: number;
  totalViews: number;
  totalLikes: number;
};

type GrowthItem = { date: string; users: number; artworks: number };
type TagItem = { name: string; count: number };

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <Card withBorder p="lg" radius="md">
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
          <Title order={2} mt={4}>{typeof value === 'number' ? value.toLocaleString() : value}</Title>
        </div>
        <Icon size={32} color={`var(--mantine-color-${color}-6)`} />
      </Group>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { getToken } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [growth, setGrowth] = useState<GrowthItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [ovRes, grRes, tgRes] = await Promise.all([
        fetch(`${API_URL}/admin/analytics/overview`, { headers }),
        fetch(`${API_URL}/admin/analytics/growth?days=30`, { headers }),
        fetch(`${API_URL}/admin/analytics/tags/trending`, { headers }),
      ]);
      if (ovRes.ok) {
        setOverview(await ovRes.json());
      }
      if (grRes.ok) {
        setGrowth(await grRes.json());
      }
      if (tgRes.ok) {
        setTags(await tgRes.json());
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return <Loader />;
  }

  return (
    <Stack gap="lg">
      <Title order={2}>Analytics</Title>

      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard label="Total Users" value={overview?.totalUsers ?? 0} icon={IconUsers} color="blue" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard label="Total Artworks" value={overview?.totalArtworks ?? 0} icon={IconArtboard} color="teal" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard label="Total Views" value={overview?.totalViews ?? 0} icon={IconEye} color="violet" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard label="Total Likes" value={overview?.totalLikes ?? 0} icon={IconHeart} color="red" />
        </Grid.Col>
      </Grid>

      <Card withBorder p="lg" radius="md">
        <Title order={4} mb="md">Growth (Last 30 Days)</Title>
        {growth.length > 0
          ? (
              <Stack gap={4}>
                {growth.slice(-7).map(item => (
                  <Group key={item.date} justify="space-between">
                    <Text size="sm">{item.date}</Text>
                    <Group gap="lg">
                      <Text size="sm" c="blue">
                        Users: +
                        {item.users}
                      </Text>
                      <Text size="sm" c="teal">
                        Artworks: +
                        {item.artworks}
                      </Text>
                    </Group>
                  </Group>
                ))}
              </Stack>
            )
          : (
              <Text c="dimmed">No growth data yet.</Text>
            )}
      </Card>

      <Card withBorder p="lg" radius="md">
        <Title order={4} mb="md">Trending Tags (7 Days)</Title>
        {tags.length > 0
          ? (
              <Group gap="xs">
                {tags.map(tag => (
                  <Card key={tag.name} withBorder p="xs" radius="sm">
                    <Text size="sm" fw={500}>
                      {tag.name}
                      {' '}
                      <Text span c="dimmed">
                        (
                        {tag.count}
                        )
                      </Text>
                    </Text>
                  </Card>
                ))}
              </Group>
            )
          : (
              <Text c="dimmed">No trending tags yet.</Text>
            )}
      </Card>
    </Stack>
  );
}
