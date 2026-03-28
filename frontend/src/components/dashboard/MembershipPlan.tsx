'use client';

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  List,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconCheck,
  IconCreditCard,
  IconCrown,
  IconDownload,
  IconFileDescription,
  IconX,
} from '@tabler/icons-react';

// Mock billing history data
const billingHistory = [
  { date: 'Oct 24, 2023', amount: '$5.00', status: 'Paid' },
  { date: 'Sep 24, 2023', amount: '$5.00', status: 'Paid' },
  { date: 'Aug 24, 2023', amount: '$5.00', status: 'Paid' },
];

export function MembershipPlan() {
  const handleChangePlan = () => {
    // eslint-disable-next-line no-console
    console.log('Payment integration coming soon!');
  };

  return (
    <Stack gap="xl">
      {/* Page Header */}
      <Box pb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
        <Title order={2} mb="xs">
          Membership Plan
        </Title>
        <Text c="dimmed" size="sm">
          Manage your subscription, billing details, and payment history.
        </Text>
      </Box>

      {/* Current Plan Card */}
      <Card
        withBorder
        radius="lg"
        p="lg"
        pos="relative"
        style={{ overflow: 'hidden' }}
      >
        {/* Background Icon */}
        <Box
          pos="absolute"
          top={-20}
          right={-20}
          style={{ opacity: 0.1, transform: 'rotate(12deg)' }}
        >
          <IconCrown size={180} color="var(--mantine-color-primary-6)" />
        </Box>

        <Stack gap="lg" pos="relative">
          {/* Plan Name & Status */}
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Box>
              <Group gap="sm" mb="xs">
                <Title order={3}>Premium Plan</Title>
                <Badge color="green" variant="light" size="sm">
                  Active
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                Your next billing date is
                {' '}
                <Text span fw={600} c="dark">November 24, 2023</Text>
                .
              </Text>
            </Box>
            <Group gap="sm">
              <Button variant="default" size="sm">
                Manage Subscription
              </Button>
              <Button size="sm" onClick={handleChangePlan}>
                Change Plan
              </Button>
            </Group>
          </Group>

          <Box style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }} pt="lg">
            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                  Payment Method
                </Text>
                <Group gap="xs">
                  <IconCreditCard size={18} color="var(--mantine-color-gray-5)" />
                  <Text fw={500}>Visa ending in 4242</Text>
                </Group>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                  Plan Cost
                </Text>
                <Text fw={500}>$5.00 / month</Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                  Status
                </Text>
                <Group gap="xs">
                  <ThemeIcon size="xs" color="green" variant="transparent">
                    <IconCheck size={14} />
                  </ThemeIcon>
                  <Text fw={500} c="green">Auto-renewal on</Text>
                </Group>
              </Grid.Col>
            </Grid>
          </Box>
        </Stack>
      </Card>

      {/* Available Plans */}
      <Box>
        <Title order={4} mb="md">
          Available Plans
        </Title>

        <Grid>
          {/* Free Plan */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card
              withBorder
              radius="lg"
              p="lg"
              h="100%"
              style={{ opacity: 0.8, transition: 'opacity 0.2s' }}
            >
              <Stack h="100%">
                <Box>
                  <Title order={4}>Free</Title>
                  <Group gap={4} mt="xs">
                    <Text size="xl" fw={700}>$0</Text>
                    <Text size="sm" c="dimmed">/mo</Text>
                  </Group>
                </Box>

                <List
                  spacing="sm"
                  size="sm"
                  flex={1}
                  icon={(
                    <ThemeIcon color="green" size="sm" radius="xl" variant="light">
                      <IconCheck size={12} />
                    </ThemeIcon>
                  )}
                >
                  <List.Item>Browse and view artworks</List.Item>
                  <List.Item>Upload up to 10 works/day</List.Item>
                  <List.Item
                    icon={(
                      <ThemeIcon color="gray" size="sm" radius="xl" variant="light">
                        <IconX size={12} />
                      </ThemeIcon>
                    )}
                    c="dimmed"
                  >
                    Access to analytics
                  </List.Item>
                  <List.Item
                    icon={(
                      <ThemeIcon color="gray" size="sm" radius="xl" variant="light">
                        <IconX size={12} />
                      </ThemeIcon>
                    )}
                    c="dimmed"
                  >
                    Sort by popularity
                  </List.Item>
                </List>

                <Button variant="default" fullWidth onClick={handleChangePlan}>
                  Downgrade
                </Button>
              </Stack>
            </Card>
          </Grid.Col>

          {/* Premium Plan */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card
              withBorder
              radius="lg"
              p="lg"
              h="100%"
              pos="relative"
              style={{
                backgroundColor: 'var(--mantine-color-primary-0)',
                borderColor: 'var(--mantine-color-primary-2)',
                borderWidth: 2,
              }}
            >
              <Badge
                pos="absolute"
                top={-10}
                right={16}
                color="primary"
                size="sm"
                tt="uppercase"
              >
                Current Plan
              </Badge>

              <Stack h="100%">
                <Box>
                  <Title order={4} c="primary">Premium</Title>
                  <Group gap={4} mt="xs">
                    <Text size="xl" fw={700}>$5</Text>
                    <Text size="sm" c="dimmed">/mo</Text>
                  </Group>
                </Box>

                <List
                  spacing="sm"
                  size="sm"
                  flex={1}
                  icon={(
                    <ThemeIcon color="primary" size="sm" radius="xl" variant="light">
                      <IconCheck size={12} />
                    </ThemeIcon>
                  )}
                >
                  <List.Item>Everything in Free</List.Item>
                  <List.Item>Unlimited uploads</List.Item>
                  <List.Item>Advanced Analytics</List.Item>
                  <List.Item>Popularity sorting & filters</List.Item>
                </List>

                <Button fullWidth disabled style={{ opacity: 0.9 }}>
                  Current Plan
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Box>

      {/* Billing History */}
      <Card withBorder radius="lg" p="lg">
        <Group justify="space-between" mb="lg">
          <Title order={4}>Billing History</Title>
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconDownload size={16} />}
          >
            Download All
          </Button>
        </Group>

        <Table.ScrollContainer minWidth={500}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th ta="right">Invoice</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {billingHistory.map((item, index) => (
                <Table.Tr key={index}>
                  <Table.Td>{item.date}</Table.Td>
                  <Table.Td fw={500}>{item.amount}</Table.Td>
                  <Table.Td>
                    <Badge color="green" variant="light" size="sm">
                      {item.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="right">
                    <ActionIcon variant="subtle" color="gray">
                      <IconFileDescription size={18} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>
    </Stack>
  );
}
