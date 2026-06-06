'use client';

import {
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useAdminAnnouncements } from '@/api/hooks';

const TYPE_COLORS: Record<string, string> = {
  INFO: 'blue',
  WARNING: 'orange',
  MAINTENANCE: 'red',
};

export default function AnnouncementsPage() {
  const { announcements, isLoading, createAnnouncement, toggleAnnouncement, deleteAnnouncement } = useAdminAnnouncements();
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'INFO' });

  const handleCreate = async () => {
    if (!form.title || !form.content) {
      return;
    }
    await createAnnouncement(form);
    notifications.show({ message: 'Announcement created', color: 'green' });
    close();
    setForm({ title: '', content: '', type: 'INFO' });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await toggleAnnouncement({ id, isActive });
  };

  const handleDelete = async (id: string) => {
    await deleteAnnouncement(id);
    notifications.show({ message: 'Announcement deleted', color: 'green' });
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Announcements</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>New Announcement</Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Title</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Active</Table.Th>
            <Table.Th>Author</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {announcements.map(ann => (
            <Table.Tr key={ann.id}>
              <Table.Td><Text size="sm" lineClamp={1}>{ann.title}</Text></Table.Td>
              <Table.Td><Badge color={TYPE_COLORS[ann.type]} variant="light">{ann.type}</Badge></Table.Td>
              <Table.Td>
                <Switch checked={ann.isActive} onChange={() => toggleActive(ann.id, ann.isActive)} size="sm" />
              </Table.Td>
              <Table.Td><Text size="sm">{ann.author.displayName || ann.author.username}</Text></Table.Td>
              <Table.Td><Text size="sm">{new Date(ann.createdAt).toLocaleDateString()}</Text></Table.Td>
              <Table.Td>
                <Button size="xs" variant="light" color="red" onClick={() => handleDelete(ann.id)}>
                  Delete
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="New Announcement" centered>
        <Stack gap="md">
          <TextInput
            label="Title"
            value={form.title}
            onChange={(e) => {
              const val = e.currentTarget.value;
              setForm(f => ({ ...f, title: val }));
            }}
            required
          />
          <Textarea
            label="Content"
            value={form.content}
            onChange={(e) => {
              const val = e.currentTarget.value;
              setForm(f => ({ ...f, content: val }));
            }}
            rows={4}
            required
          />
          <Select label="Type" value={form.type} onChange={v => setForm(f => ({ ...f, type: v || 'INFO' }))} data={['INFO', 'WARNING', 'MAINTENANCE']} />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
