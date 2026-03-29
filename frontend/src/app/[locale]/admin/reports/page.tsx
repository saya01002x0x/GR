'use client';

import { useAuth } from '@clerk/nextjs';
import {
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Report = {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  artwork: { id: string; title: string; images: { thumbnailUrl: string | null }[] } | null;
  reporter: { id: string; username: string; displayName: string | null };
  resolvedBy: { id: string; username: string; displayName: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'orange',
  RESOLVED: 'green',
  DISMISSED: 'gray',
};

export default function ReportsPage() {
  const { getToken } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>('PENDING');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolution, setResolution] = useState('');
  const [opened, { open, close }] = useDisclosure(false);

  const fetchReports = useCallback(async () => {
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (statusFilter) {
        params.set('status', statusFilter);
      }
      const res = await fetch(`${API_URL}/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [statusFilter, getToken]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (status: 'RESOLVED' | 'DISMISSED') => {
    if (!selectedReport) {
      return;
    }
    const token = await getToken();
    const res = await fetch(`${API_URL}/reports/${selectedReport.id}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status, resolution }),
    });
    if (res.ok) {
      notifications.show({ message: `Report ${status.toLowerCase()}`, color: 'green' });
      close();
      setResolution('');
      fetchReports();
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Reports</Title>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          data={[
            { value: 'PENDING', label: 'Pending' },
            { value: 'RESOLVED', label: 'Resolved' },
            { value: 'DISMISSED', label: 'Dismissed' },
          ]}
          placeholder="All statuses"
          clearable
          w={160}
        />
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Artwork</Table.Th>
            <Table.Th>Reason</Table.Th>
            <Table.Th>Reporter</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {reports.map(report => (
            <Table.Tr key={report.id}>
              <Table.Td>
                <Text size="sm" lineClamp={1}>{report.artwork?.title ?? 'Deleted'}</Text>
              </Table.Td>
              <Table.Td><Badge variant="light">{report.reason}</Badge></Table.Td>
              <Table.Td><Text size="sm">{report.reporter.displayName || report.reporter.username}</Text></Table.Td>
              <Table.Td><Badge color={STATUS_COLORS[report.status]}>{report.status}</Badge></Table.Td>
              <Table.Td><Text size="sm">{new Date(report.createdAt).toLocaleDateString()}</Text></Table.Td>
              <Table.Td>
                {report.status === 'PENDING' && (
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => {
                      setSelectedReport(report);
                      open();
                    }}
                  >
                    Resolve
                  </Button>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Resolve Report" centered>
        <Stack gap="md">
          <Text size="sm">
            <b>Reason:</b>
            {' '}
            {selectedReport?.reason}
          </Text>
          {selectedReport?.description && (
            <Text size="sm">
              <b>Description:</b>
              {' '}
              {selectedReport.description}
            </Text>
          )}
          <Textarea label="Resolution note" value={resolution} onChange={e => setResolution(e.currentTarget.value)} rows={3} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => handleResolve('DISMISSED')}>Dismiss</Button>
            <Button color="green" onClick={() => handleResolve('RESOLVED')}>Resolve</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
