'use client';

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
import { useAdminUserPatrol } from '@/api/hooks';

export default function UserPatrolDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const { data, isLoading } = useAdminUserPatrol(userId);

  if (isLoading) {
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
