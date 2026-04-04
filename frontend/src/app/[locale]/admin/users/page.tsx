'use client';

import {
  Avatar,
  Badge,
  Button,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAdminUsers, useUserProfile } from '@/api/hooks';

const ROLE_RANK: Record<string, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

const ALL_ROLES = ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

export default function UserPatrolPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const { data: profile } = useUserProfile();
  const myRole = profile?.role ?? null;
  const myRank = ROLE_RANK[myRole ?? ''] ?? 0;
  const visibleRoleOptions = ALL_ROLES.filter(r => (ROLE_RANK[r] ?? 0) < myRank);

  const { users, isLoading, banUser } = useAdminUsers(debouncedSearch || undefined, roleFilter || undefined);

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    try {
      await banUser({ userId, isBanned });
      notifications.show({ message: `User ${isBanned ? 'unbanned' : 'banned'}`, color: 'green' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed';
      notifications.show({ message, color: 'red' });
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Stack gap="lg">
      <Title order={2}>User Patrol</Title>
      <Group>
        <TextInput
          placeholder="Search users..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          value={roleFilter}
          onChange={setRoleFilter}
          data={visibleRoleOptions}
          placeholder="All roles"
          clearable
          w={160}
        />
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>User</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Artworks</Table.Th>
            <Table.Th>Joined</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map(user => (
            <Table.Tr key={user.id}>
              <Table.Td>
                <Group gap="sm">
                  <Avatar src={user.avatar} size="sm" radius="xl" />
                  <div>
                    <Text size="sm" fw={500}>{user.displayName || user.username}</Text>
                    <Text size="xs" c="dimmed">{user.email}</Text>
                  </div>
                </Group>
              </Table.Td>
              <Table.Td><Badge variant="light">{user.role}</Badge></Table.Td>
              <Table.Td>
                <Badge color={user.isBanned ? 'red' : 'green'} variant="light">
                  {user.isBanned ? 'Banned' : 'Active'}
                </Badge>
              </Table.Td>
              <Table.Td>{user._count.artworks}</Table.Td>
              <Table.Td><Text size="sm">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</Text></Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Button
                    component={Link}
                    href={`/admin/users/${user.id}`}
                    size="xs"
                    variant="light"
                  >
                    View
                  </Button>
                  {myRank >= (ROLE_RANK.ADMIN ?? 0) && (
                    <Button
                      size="xs"
                      variant="light"
                      color={user.isBanned ? 'green' : 'red'}
                      onClick={() => handleBanToggle(user.id, user.isBanned)}
                    >
                      {user.isBanned ? 'Unban' : 'Ban'}
                    </Button>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          {users.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text ta="center" c="dimmed" py="md">No users found</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
