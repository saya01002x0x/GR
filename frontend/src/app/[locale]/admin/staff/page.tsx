'use client';

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
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useAdminStaff } from '@/api/hooks';

const ROLE_COLORS: Record<string, string> = {
  MODERATOR: 'green',
  ADMIN: 'blue',
  SUPER_ADMIN: 'grape',
};

export default function StaffPage() {
  const { staff, isLoading, changeRole, demoteUser } = useAdminStaff();
  const [selectedUser, setSelectedUser] = useState<NonNullable<typeof staff>[number] | null>(null);
  const [newRole, setNewRole] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) {
      return;
    }
    try {
      await changeRole({ userId: selectedUser.id, role: newRole });
      notifications.show({ message: 'Role updated', color: 'green' });
      close();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed';
      notifications.show({ message, color: 'red' });
    }
  };

  const handleDemote = async (userId: string) => {
    try {
      await demoteUser(userId);
      notifications.show({ message: 'User demoted to USER', color: 'green' });
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Stack gap="lg">
      <Title order={2}>Staff Management</Title>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Staff Member</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Joined</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {staff.map(member => (
            <Table.Tr key={member.id}>
              <Table.Td>
                <Group gap="sm">
                  <Avatar src={member.avatar} size="sm" radius="xl" />
                  <div>
                    <Text size="sm" fw={500}>{member.displayName || member.username}</Text>
                    <Text size="xs" c="dimmed">{member.email}</Text>
                  </div>
                </Group>
              </Table.Td>
              <Table.Td>
                <Badge color={ROLE_COLORS[member.role] ?? 'gray'} variant="light">
                  {member.role}
                </Badge>
              </Table.Td>
              <Table.Td><Text size="sm">{new Date(member.createdAt).toLocaleDateString()}</Text></Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => {
                      setSelectedUser(member);
                      setNewRole(member.role);
                      open();
                    }}
                  >
                    Change Role
                  </Button>
                  {member.role !== 'SUPER_ADMIN' && (
                    <Button size="xs" variant="light" color="red" onClick={() => handleDemote(member.id)}>
                      Demote
                    </Button>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Change Role" centered>
        <Stack gap="md">
          <Text size="sm">
            Staff:
            <b>{selectedUser?.displayName || selectedUser?.username}</b>
          </Text>
          <Select
            label="New Role"
            value={newRole}
            onChange={setNewRole}
            data={['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancel</Button>
            <Button onClick={handleRoleChange}>Save</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
