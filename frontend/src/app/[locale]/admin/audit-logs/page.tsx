'use client';

import {
  Avatar,
  Badge,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { useAdminAuditLogs } from '@/api/hooks';

const ACTION_COLORS: Record<string, string> = {
  'user.ban': 'red',
  'user.unban': 'green',
  'user.role_change': 'violet',
  'artwork.approve': 'green',
  'artwork.reject': 'red',
  'report.resolved': 'blue',
  'report.dismissed': 'gray',
  'ranking.update': 'orange',
  'announcement.create': 'teal',
  'announcement.update': 'cyan',
  'announcement.delete': 'red',
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const { data: logsData, isLoading } = useAdminAuditLogs(debouncedSearch || undefined);
  const logs = logsData?.logs ?? [];

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Stack gap="lg">
      <Title order={2}>Audit Logs</Title>
      <TextInput
        placeholder="Filter by action (e.g. user.ban, artwork.reject)..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={e => setSearch(e.currentTarget.value)}
      />

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Actor</Table.Th>
            <Table.Th>Action</Table.Th>
            <Table.Th>Target</Table.Th>
            <Table.Th>Details</Table.Th>
            <Table.Th>Time</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {logs.map(log => (
            <Table.Tr key={log.id}>
              <Table.Td>
                <Group gap="xs">
                  <Avatar src={log.actor.avatar} size="xs" radius="xl" />
                  <Text size="sm">{log.actor.displayName || log.actor.username}</Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Badge color={ACTION_COLORS[log.action] ?? 'gray'} variant="light">
                  {log.action}
                </Badge>
              </Table.Td>
              <Table.Td>
                {log.targetType && log.targetId
                  ? (
                      <Text size="xs" c="dimmed">
                        {log.targetType}
                        :
                        {log.targetId.slice(0, 8)}
                        ...
                      </Text>
                    )
                  : (
                      <Text size="xs" c="dimmed">-</Text>
                    )}
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {log.details ? JSON.stringify(log.details) : '-'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{new Date(log.createdAt).toLocaleString()}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
