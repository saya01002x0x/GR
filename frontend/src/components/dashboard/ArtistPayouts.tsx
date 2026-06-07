'use client';

import type { Payout, RevenueStats } from '@gr/shared';
import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  NumberInput,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconBucket,
  IconCash,
  IconCheck,
  IconCurrencyDollar,
  IconPlus,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useMyPayouts, useMyRevenue, useRequestPayout } from '@/api/hooks/use-payments';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'yellow',
  APPROVED: 'blue',
  PAID: 'green',
  REJECTED: 'red',
};

export function ArtistPayouts() {
  const { data: payoutsData, isLoading: payoutsLoading } = useMyPayouts();
  const { data: revenueData } = useMyRevenue();

  const requestPayout = useRequestPayout();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState<number>(0);
  const [requestNote, setRequestNote] = useState('');

  const payouts = (payoutsData?.data || []) as Payout[];
  const revenue = revenueData?.data as RevenueStats | null;
  const availableBalance = revenue?.availableBalance || 0;
  const canRequestPayout = availableBalance >= 10;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
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

  const handleRequestPayout = async () => {
    if (!requestAmount || requestAmount < 10) {
      notifications.show({ message: 'Minimum payout is $10', color: 'red' });
      return;
    }
    if (requestAmount > availableBalance) {
      notifications.show({ message: 'Amount exceeds available balance', color: 'red' });
      return;
    }
    try {
      await requestPayout.mutateAsync({ amount: requestAmount, note: requestNote || undefined });
      notifications.show({ message: 'Payout requested successfully', color: 'green' });
      setShowRequestModal(false);
      setRequestAmount(0);
      setRequestNote('');
    } catch {
      notifications.show({ message: 'Failed to request payout', color: 'red' });
    }
  };

  return (
    <Stack gap="xl">
      <Box pb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Box>
            <Title order={2} mb="xs">
              Payouts
            </Title>
            <Text c="dimmed" size="sm">
              Request payouts from your subscriber earnings.
            </Text>
          </Box>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowRequestModal(true)}
            disabled={!canRequestPayout}
          >
            Request Payout
          </Button>
        </Group>
      </Box>

      <Grid>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder radius="lg" p="md">
            <Group gap="xs">
              <IconCurrencyDollar size={20} color="var(--mantine-color-green-6)" />
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Total Revenue
                </Text>
                <Text fw={700} size="lg">
                  {formatCurrency(revenue?.totalRevenue || 0)}
                </Text>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder radius="lg" p="md">
            <Group gap="xs">
              <IconCash size={20} color="var(--mantine-color-blue-6)" />
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Monthly Revenue
                </Text>
                <Text fw={700} size="lg">
                  {formatCurrency(revenue?.monthlyRevenue || 0)}
                </Text>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder radius="lg" p="md">
            <Group gap="xs">
              <IconBucket size={20} color="var(--mantine-color-yellow-6)" />
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Available Balance
                </Text>
                <Text fw={700} size="lg">
                  {formatCurrency(availableBalance)}
                </Text>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder radius="lg" p="md">
            <Group gap="xs">
              <IconCheck size={20} color="var(--mantine-color-primary-6)" />
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Total Paid
                </Text>
                <Text fw={700} size="lg">
                  {formatCurrency(revenue?.totalPayouts || 0)}
                </Text>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder radius="lg" p="lg">
        <Group justify="space-between" mb="md">
          <Title order={4}>Payout History</Title>
          <Text size="sm" c="dimmed">
            Min. payout: $10 • Platform fee: 10%
          </Text>
        </Group>

        {payoutsLoading
          ? (
              <Text c="dimmed">Loading...</Text>
            )
          : payouts.length === 0
            ? (
                <Text c="dimmed" ta="center" py="xl">
                  No payout requests yet.
                </Text>
              )
            : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Fee (10%)</Table.Th>
                      <Table.Th>Net</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Requested</Table.Th>
                      <Table.Th>Notes</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {payouts.map(payout => (
                      <Table.Tr key={payout.id}>
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
                        <Table.Td>
                          <Text size="sm" c="dimmed" maw={200} lineClamp={1}>
                            {payout.note || '-'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
      </Card>

      {showRequestModal && (
        <Box
          pos="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          onClick={() => setShowRequestModal(false)}
        >
          <Card
            pos="absolute"
            top="50%"
            left="50%"
            w={400}
            p="xl"
            radius="lg"
            style={{ transform: 'translate(-50%, -50%)' }}
            onClick={e => e.stopPropagation()}
          >
            <Title order={3} mb="lg">
              Request Payout
            </Title>

            <Stack gap="md">
              <Box>
                <Text size="sm" fw={500} mb="xs">
                  Available Balance
                </Text>
                <Text size="xl" fw={700}>
                  {formatCurrency(availableBalance)}
                </Text>
              </Box>

              <NumberInput
                label="Amount (USD)"
                placeholder="Enter amount"
                min={10}
                max={availableBalance}
                value={requestAmount}
                onChange={val => setRequestAmount(Number(val))}
                disabled={!canRequestPayout}
              />

              <Textarea
                label="Note (optional)"
                placeholder="Add a note..."
                value={requestNote}
                onChange={e => setRequestNote(e.target.value)}
              />

              {canRequestPayout && (
                <Text size="sm" c="dimmed">
                  You will receive:
                  {' '}
                  <Text span fw={600}>
                    {formatCurrency(requestAmount - requestAmount * 0.1)}
                  </Text>
                  {' '}
                  (after 10% platform fee)
                </Text>
              )}

              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={() => setShowRequestModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestPayout}
                  loading={requestPayout.isPending}
                  disabled={!canRequestPayout || requestAmount < 10}
                >
                  Request Payout
                </Button>
              </Group>
            </Stack>
          </Card>
        </Box>
      )}
    </Stack>
  );
}
