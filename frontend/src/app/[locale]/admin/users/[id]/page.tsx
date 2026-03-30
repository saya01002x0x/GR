'use client';

import { useAuth } from '@clerk/nextjs';
import {
  Avatar,
  Badge,
  Card,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type PatrolData = {
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    avatar: string | null;
    role: string;
    isBanned: boolean;
    bannedAt: string | null;
    isArtist: boolean;
    createdAt: string;
    _count: { artworks: number; comments: number; likes: number };
  };
  reports: {
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    artwork: { id: string; title: string } | null;
  }[];
};

export default function UserPatrolDetailPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const userId = params.id as string;
  const [data, setData] = useState<PatrolData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/admin/users/${userId}/patrol`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [userId, getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <Loader />;
  }
  if (!data) {
    return <Text c="dimmed">User not found</Text>;
  }

  const { user, reports } = data;

  return (
    <Stack gap="lg">
      <Title order={2}>User Patrol</Title>

      <Card withBorder p="lg" radius="md">
        <Group gap="md">
          <Avatar src={user.avatar} size="xl" radius="xl" />
          <div>
            <Text fw={700} size="lg">{user.displayName || user.username}</Text>
            <Text size="sm" c="dimmed">{user.email}</Text>
            <Group gap="xs" mt="xs">
              <Badge variant="light">{user.role}</Badge>
              <Badge color={user.isBanned ? 'red' : 'green'} variant="light">
                {user.isBanned ? 'Banned' : 'Active'}
              </Badge>
              {user.isArtist && <Badge color="grape" variant="light">Artist</Badge>}
            </Group>
          </div>
        </Group>
        <Group mt="md" gap="xl">
          <Text size="sm">
            <b>Artworks:</b>
            {' '}
            {user._count.artworks}
          </Text>
          <Text size="sm">
            <b>Comments:</b>
            {' '}
            {user._count.comments}
          </Text>
          <Text size="sm">
            <b>Likes:</b>
            {' '}
            {user._count.likes}
          </Text>
          <Text size="sm">
            <b>Joined:</b>
            {' '}
            {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </Group>
      </Card>

      <Title order={3}>Report History</Title>
      {reports.length === 0
        ? (
            <Text c="dimmed">No reports associated with this user.</Text>
          )
        : (
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Artwork</Table.Th>
                  <Table.Th>Reason</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reports.map(r => (
                  <Table.Tr key={r.id}>
                    <Table.Td>{r.artwork?.title ?? 'Deleted'}</Table.Td>
                    <Table.Td><Badge variant="light">{r.reason}</Badge></Table.Td>
                    <Table.Td><Badge color={r.status === 'PENDING' ? 'orange' : 'green'} variant="light">{r.status}</Badge></Table.Td>
                    <Table.Td>{new Date(r.createdAt).toLocaleDateString()}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
    </Stack>
  );
}
