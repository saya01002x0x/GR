'use client';

import { useAuth } from '@clerk/nextjs';
import { Card, Grid, Group, Loader, Stack, Text, Title } from '@mantine/core';
import {
  IconAlertTriangle,
  IconArtboard,
  IconFlag,
  IconUserOff,
  IconUsers,
} from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type DashboardStats = {
  pendingReports: number;
  flaggedContent: number;
  bannedToday: number;
  totalUsers: number;
  totalArtworks: number;
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <Card withBorder p="lg" radius="md">
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
          <Title order={2} mt={4}>{value}</Title>
        </div>
        <Icon size={32} color={`var(--mantine-color-${color}-6)`} />
      </Group>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <Loader />;
  }

  return (
    <Stack gap="lg">
      <Title order={2}>Dashboard</Title>
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard label="Pending Reports" value={stats?.pendingReports ?? 0} icon={IconFlag} color="orange" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard label="Flagged Content" value={stats?.flaggedContent ?? 0} icon={IconAlertTriangle} color="red" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard label="Banned Today" value={stats?.bannedToday ?? 0} icon={IconUserOff} color="grape" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={IconUsers} color="blue" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <StatCard label="Total Artworks" value={stats?.totalArtworks ?? 0} icon={IconArtboard} color="teal" />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
