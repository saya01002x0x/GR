'use client';

import type { Payout } from '@gr/shared';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
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
import {
  IconBucket,
  IconCheck,
  IconCurrencyDollar,
  IconX,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useAllPayouts, useApprovePayout, useMarkPayoutPaid, useRejectPayout } from '@/api/hooks/use-payments';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'yellow',
  APPROVED: 'blue',
  PAID: 'green',
  REJECTED: 'red',
};

export default function PayoutsPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [rejectModalOpened, { open: openRejectModal, close: closeRejectModal }] = useDisclosure(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: payoutsData, isLoading, refetch } = useAllPayouts(statusFilter || undefined);
  const approvePayout = useApprovePayout();
  const rejectPayout = useRejectPayout();
  const markPaid = useMarkPayoutPaid();

  const payouts = (payoutsData?.data || []) as Payout[];

  const toNumber = (value: unknown) => {
    const amount = typeof value === 'number' ? value : Number(value || 0);
    return Number.isFinite(amount) ? amount : 0;
  };

  const formatCurrency = (amount: unknown) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(toNumber(amount));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApprove = async (payoutId: string) => {
    try {
      await approvePayout.mutateAsync(payoutId);
      notifications.show({ message: 'Payout approved', color: 'green' });
      refetch();
    } catch {
      notifications.show({ message: 'Failed to approve payout', color: 'red' });
    }
  };

  const handleReject = async () => {
    if (!selectedPayout) {
      return;
    }
    try {
      await rejectPayout.mutateAsync({ payoutId: selectedPayout.id, reason: rejectReason });
      notifications.show({ message: 'Payout rejected', color: 'green' });
      closeRejectModal();
      setSelectedPayout(null);
      setRejectReason('');
      refetch();
    } catch {
      notifications.show({ message: 'Failed to reject payout', color: 'red' });
    }
  };

  const handleMarkPaid = async (payoutId: string) => {
    try {
      await markPaid.mutateAsync(payoutId);
      notifications.show({ message: 'Payout marked as paid', color: 'green' });
      refetch();
    } catch {
      notifications.show({ message: 'Failed to mark payout as paid', color: 'red' });
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Payout Requests</Title>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          data={[
            { value: '', label: 'All Status' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'PAID', label: 'Paid' },
            { value: 'REJECTED', label: 'Rejected' },
          ]}
          placeholder="Filter by status"
          clearable
          w={160}
        />
      </Group>

      <Group>
        <Card withBorder radius="lg" p="md" style={{ flex: 1 }}>
          <Group gap="xs">
            <IconBucket size={20} color="var(--mantine-color-yellow-6)" />
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Pending
              </Text>
              <Text fw={700} size="lg">
                {formatCurrency(payouts.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + toNumber(p.amount), 0))}
              </Text>
            </Box>
          </Group>
        </Card>
        <Card withBorder radius="lg" p="md" style={{ flex: 1 }}>
          <Group gap="xs">
            <IconCurrencyDollar size={20} color="var(--mantine-color-blue-6)" />
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Approved
              </Text>
              <Text fw={700} size="lg">
                {formatCurrency(payouts.filter(p => p.status === 'APPROVED').reduce((sum, p) => sum + toNumber(p.amount), 0))}
              </Text>
            </Box>
          </Group>
        </Card>
      </Group>

      <Card withBorder radius="lg" p="lg">
        {isLoading
          ? (
              <Loader />
            )
          : payouts.length === 0
            ? (
                <Text c="dimmed" ta="center" py="xl">
                  No payout requests found.
                </Text>
              )
            : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Artist</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Fee (10%)</Table.Th>
                      <Table.Th>Net</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Requested</Table.Th>
                      <Table.Th ta="right">Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {payouts.map(payout => (
                      <Table.Tr key={payout.id}>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar
                              src={payout.artist?.avatar}
                              size="sm"
                              radius="xl"
                            />
                            <Text size="sm" fw={500}>
                              {payout.artist?.displayName || payout.artist?.username || 'Unknown artist'}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={500}>{formatCurrency(payout.amount)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text c="dimmed" size="sm">
                            {formatCurrency(payout.fee)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={600}>{formatCurrency(payout.netAmount)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={STATUS_COLORS[payout.status]} variant="light">
                            {payout.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(payout.requestedAt)}</Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Group gap={4} justify="flex-end">
                            {payout.status === 'PENDING' && (
                              <>
                                <ActionIcon
                                  color="green"
                                  variant="light"
                                  size="sm"
                                  onClick={() => handleApprove(payout.id)}
                                  loading={approvePayout.isPending}
                                >
                                  <IconCheck size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  color="red"
                                  variant="light"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPayout(payout);
                                    openRejectModal();
                                  }}
                                  loading={rejectPayout.isPending}
                                >
                                  <IconX size={16} />
                                </ActionIcon>
                              </>
                            )}
                            {payout.status === 'APPROVED' && (
                              <Button
                                size="xs"
                                variant="light"
                                onClick={() => handleMarkPaid(payout.id)}
                                loading={markPaid.isPending}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
      </Card>

      <Modal
        opened={rejectModalOpened}
        onClose={closeRejectModal}
        title="Reject Payout Request"
      >
        <Stack gap="md">
          <Text>
            You are about to reject a payout request from
            {' '}
            <Text span fw={600}>
              {selectedPayout?.artist?.displayName || selectedPayout?.artist?.username}
            </Text>
            .
          </Text>
          <Textarea
            label="Rejection Reason"
            placeholder="Please provide a reason for rejection..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            required
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeRejectModal}>
              Cancel
            </Button>
            <Button color="red" onClick={handleReject} loading={rejectPayout.isPending}>
              Reject Payout
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
