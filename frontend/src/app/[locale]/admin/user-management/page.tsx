'use client';

import { useAuth } from '@clerk/nextjs';
import {
  Avatar,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

export default function UserManagementPage() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [newRole, setNewRole] = useState<string | null>(null);
  const [roleModalOpened, { open: openRoleModal, close: closeRoleModal }] = useDisclosure(false);

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

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) {
      return;
    }
    const token = await getToken();
    const res = await fetch(`${API_URL}/admin/users/${selectedUser.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      notifications.show({ message: 'Role updated', color: 'green' });
      closeRoleModal();
      fetchUsers();
    } else {
      const err = await res.json().catch(() => ({}));
      notifications.show({ message: err.message || 'Failed', color: 'red' });
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <Stack gap="lg">
      <Title order={2}>User Management</Title>
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
          data={['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']}
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
              <Table.Td><Text size="sm">{new Date(user.createdAt).toLocaleDateString()}</Text></Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="light"
                    color={user.isBanned ? 'green' : 'red'}
                    onClick={() => handleBanToggle(user.id, user.isBanned)}
                  >
                    {user.isBanned ? 'Unban' : 'Ban'}
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => {
                      setSelectedUser(user);
                      setNewRole(user.role);
                      openRoleModal();
                    }}
                  >
                    Role
                  </Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={roleModalOpened} onClose={closeRoleModal} title="Change Role" centered>
        <Stack gap="md">
          <Text size="sm">
            User:
            <b>{selectedUser?.displayName || selectedUser?.username}</b>
          </Text>
          <Select
            label="New Role"
            value={newRole}
            onChange={setNewRole}
            data={['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeRoleModal}>Cancel</Button>
            <Button onClick={handleRoleChange}>Save</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
