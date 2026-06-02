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
  Loader,
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
} from '@tabler/icons-react';
import { useCreateSubscriptionCheckout, useMyPayments, useMySubscription, usePlans, useSubscribedTiers, useSubscriptionPortal } from '@/api/hooks/use-payments';

export function MembershipPlan() {
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const { data: subData, isLoading: subLoading } = useMySubscription();
  const { data: subscribedTiersData, isLoading: tiersLoading } = useSubscribedTiers();
  const { data: paymentsData, isLoading: paymentsLoading } = useMyPayments();

  const createCheckout = useCreateSubscriptionCheckout();
  const subscriptionPortal = useSubscriptionPortal();

  const plans = plansData?.data || [];
  const subscription = subData?.data;
  const subscribedTiers = subscribedTiersData?.data || [];
  const payments = (paymentsData?.data as Array<{ id: string; amount: number; status: string; createdAt: string }>) || [];

  const currentPlan = subscription?.plan;
  const isActive = subscription?.status === 'ACTIVE';

  const handleChangePlan = (planId: string) => {
    createCheckout.mutate(
      { planId },
      {
        onSuccess: (response) => {
          const checkoutUrl = response.data.checkoutUrl;
          if (checkoutUrl) {
            window.location.href = checkoutUrl;
          }
        },
      },
    );
  };

  const handleCancel = () => {
    subscriptionPortal.mutate(undefined, {
      onSuccess: (response) => {
        const portalUrl = response.data.url;
        if (portalUrl) {
          window.location.href = portalUrl;
        }
      },
    });
  };

  if (plansLoading || subLoading || tiersLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader size="lg" />
        <Text c="dimmed">Loading subscription details...</Text>
      </Stack>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  return (
    <Stack gap="xl">
      <Box pb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
        <Title order={2} mb="xs">
          Membership Plan
        </Title>
        <Text c="dimmed" size="sm">
          Manage your subscription, billing details, and payment history.
        </Text>
      </Box>

      <Card withBorder radius="lg" p="lg">
        <Group justify="space-between" mb="lg" align="flex-start">
          <Box>
            <Title order={4}>Artist Memberships</Title>
            <Text c="dimmed" size="sm">
              Tiers you subscribed to from artists.
            </Text>
          </Box>
          {subscribedTiers.length > 0 && (
            <Badge color="green" variant="light">
              {subscribedTiers.length}
              {' '}
              active
            </Badge>
          )}
        </Group>

        {subscribedTiers.length === 0
          ? (
              <Text c="dimmed" ta="center" py="lg">
                No artist memberships yet.
              </Text>
            )
          : (
              <Stack gap="sm">
                {subscribedTiers.map((tierSubscription) => {
                  const tier = tierSubscription.tier;
                  const artist = tier && 'artist' in tier
                    ? tier.artist as { username?: string; displayName?: string | null } | undefined
                    : undefined;

                  return (
                    <Card key={tierSubscription.id} withBorder radius="md" p="md">
                      <Group justify="space-between" align="flex-start" wrap="wrap">
                        <Box>
                          <Group gap="xs" mb={4}>
                            <ThemeIcon color="primary" variant="light" size="sm">
                              <IconCrown size={14} />
                            </ThemeIcon>
                            <Text fw={700}>
                              {tier?.name || 'Artist tier'}
                            </Text>
                            <Badge color="green" variant="light" size="sm">
                              {tierSubscription.status}
                            </Badge>
                          </Group>
                          <Text size="sm" c="dimmed">
                            {artist?.displayName || artist?.username || 'Artist'}
                          </Text>
                        </Box>

                        <Box ta={{ base: 'left', sm: 'right' }}>
                          {tier && (
                            <Text fw={600}>
                              {formatCurrency(tier.price, tier.currency)}
                              {' '}
                              / month
                            </Text>
                          )}
                          {/* <Text size="xs" c="dimmed">
                            Renews
                            {' '}
                            {tierSubscription.currentPeriodEnd
                              ? formatDate(tierSubscription.currentPeriodEnd)
                              : 'N/A'}
                          </Text> */}
                          <Button
                            variant="default"
                            size="xs"
                            mt="xs"
                            onClick={handleCancel}
                            loading={subscriptionPortal.isPending}
                          >
                            Manage / Cancel
                          </Button>
                        </Box>
                      </Group>
                    </Card>
                  );
                })}
              </Stack>
            )}
      </Card>

      {subscription && (
        <Card
          withBorder
          radius="lg"
          p="lg"
          pos="relative"
          style={{ overflow: 'hidden' }}
        >
          <Box
            pos="absolute"
            top={-20}
            right={-20}
            style={{ opacity: 0.1, transform: 'rotate(12deg)' }}
          >
            <IconCrown size={180} color="var(--mantine-color-primary-6)" />
          </Box>

          <Stack gap="lg" pos="relative">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Box>
                <Group gap="sm" mb="xs">
                  <Title order={3}>{currentPlan?.name || 'Free'}</Title>
                  <Badge color={isActive ? '-green' : 'gray'} variant="light" size="sm">
                    {isActive ? 'Active' : subscription.status}
                  </Badge>
                </Group>
                {currentPlan?.price
                  ? (
                      <Text size="sm" c="dimmed">
                        Your next billing date is
                        {' '}
                        <Text span fw={600} c="dark">
                          {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'N/A'}
                        </Text>
                        .
                      </Text>
                    )
                  : (
                      <Text size="sm" c="dimmed">
                        Upgrade to unlock premium features.
                      </Text>
                    )}
              </Box>
              {isActive && currentPlan?.price && currentPlan.price > 0 && (
                <Group gap="sm">
                  <Button variant="default" size="sm" onClick={handleCancel} loading={subscriptionPortal.isPending}>
                    Manage Subscription
                  </Button>
                </Group>
              )}
            </Group>

            {currentPlan?.price && (
              <Box style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }} pt="lg">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                      Payment Method
                    </Text>
                    <Group gap="xs">
                      <IconCreditCard size={18} color="var(--mantine-color-gray-5)" />
                      <Text fw={500}>
                        {subscription.provider}
                        {' '}
                        ending in ***
                      </Text>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                      Plan Cost
                    </Text>
                    <Text fw={500}>
                      {formatCurrency(currentPlan.price)}
                      {' '}
                      / month
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                      Auto-Renewal
                    </Text>
                    <Group gap="xs">
                      <ThemeIcon size="xs" color={isActive ? 'green' : 'gray'} variant="transparent">
                        <IconCheck size={14} />
                      </ThemeIcon>
                      <Text fw={500} c={isActive ? 'green' : 'dimmed'}>
                        {isActive ? 'Auto-renewal on' : 'Off'}
                      </Text>
                    </Group>
                  </Grid.Col>
                </Grid>
              </Box>
            )}
          </Stack>
        </Card>
      )}

      <Box>
        <Title order={4} mb="md">
          Available Plans
        </Title>

        <Grid>
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.planId === plan.id;
            const canUpgrade = !subscription || subscription.status !== 'ACTIVE' || (currentPlan?.price || 0) < plan.price;

            return (
              <Grid.Col span={{ base: 12, md: 6 }} key={plan.id}>
                <Card
                  withBorder
                  radius="lg"
                  p="lg"
                  h="100%"
                  pos="relative"
                  style={{
                    backgroundColor: isCurrentPlan ? 'var(--mantine-color-primary-0)' : undefined,
                    borderColor: isCurrentPlan ? 'var(--mantine-color-primary-6)' : undefined,
                    borderWidth: isCurrentPlan ? 2 : 1,
                  }}
                >
                  {isCurrentPlan && (
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
                  )}

                  <Stack h="100%">
                    <Box>
                      <Title order={4} c={isCurrentPlan ? 'primary' : undefined}>
                        {plan.name}
                      </Title>
                      <Group gap={4} mt="xs">
                        <Text size="xl" fw={700}>
                          {plan.price === 0 ? '$0' : formatCurrency(plan.price)}
                        </Text>
                        <Text size="sm" c="dimmed">/mo</Text>
                      </Group>
                      {plan.description && (
                        <Text size="sm" c="dimmed" mt="xs">
                          {plan.description}
                        </Text>
                      )}
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
                      {plan.features.map((feature: string) => (
                        <List.Item key={`${plan.id}-${feature}`}>{feature}</List.Item>
                      ))}
                    </List>

                    {plan.price === 0
                      ? (
                          <Button variant="default" fullWidth disabled={isCurrentPlan}>
                            {isCurrentPlan ? 'Current Plan' : 'Downgrade'}
                          </Button>
                        )
                      : (
                          <Button
                            fullWidth
                            disabled={isCurrentPlan}
                            loading={createCheckout.isPending && createCheckout.variables?.planId === plan.id}
                            onClick={() => handleChangePlan(plan.id)}
                          >
                            {isCurrentPlan
                              ? 'Current Plan'
                              : canUpgrade
                                ? 'Upgrade'
                                : 'Switch'}
                          </Button>
                        )}
                  </Stack>
                </Card>
              </Grid.Col>
            );
          })}
        </Grid>
      </Box>

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

        {paymentsLoading
          ? (
              <Loader size="sm" />
            )
          : payments.length === 0
            ? (
                <Text c="dimmed" ta="center" py="lg">
                  No payment history yet.
                </Text>
              )
            : (
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
                      {payments.map(payment => (
                        <Table.Tr key={payment.id}>
                          <Table.Td>{formatDate(payment.createdAt)}</Table.Td>
                          <Table.Td fw={500}>{formatCurrency(payment.amount)}</Table.Td>
                          <Table.Td>
                            <Badge
                              color={payment.status === 'COMPLETED' ? 'green' : payment.status === 'PENDING' ? 'yellow' : 'red'}
                              variant="light"
                              size="sm"
                            >
                              {payment.status}
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
              )}
      </Card>
    </Stack>
  );
}
