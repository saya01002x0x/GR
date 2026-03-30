'use client';

import { useAuth } from '@clerk/nextjs';
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
import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ROLE_RANK: Record<string, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

const ALL_ROLES = ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

type UserItem = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatar: string | null;
  role: string;
  isBanned: boolean;
  isArtist: boolean;
  createdAt: string;
  _count: { artworks: number };
};

export default function UserPatrolPage() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);

  const myRank = ROLE_RANK[myRole ?? ''] ?? 0;
  const visibleRoleOptions = ALL_ROLES.filter(r => (ROLE_RANK[r] ?? 0) < myRank);

  useEffect(() => {
    let cancelled = false;
    async function loadRole() {
      try {
        const token = await getToken();
        if (!token || cancelled) {
          return;
        }
        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setMyRole(data.role);
        }
      } catch { /* ignore */ }
    }
    loadRole();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }
      if (roleFilter) {
        params.set('role', roleFilter);
      }
      const res = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, getToken]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    const token = await getToken();
    const endpoint = isBanned ? 'unban' : 'ban';
    const res = await fetch(`${API_URL}/admin/users/${userId}/${endpoint}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      notifications.show({ message: `User ${endpoint}ned`, color: 'green' });
      fetchUsers();
    } else {
      const err = await res.json().catch(() => ({}));
      notifications.show({ message: err.message || 'Action failed', color: 'red' });
    }
  };

  if (loading) {
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
