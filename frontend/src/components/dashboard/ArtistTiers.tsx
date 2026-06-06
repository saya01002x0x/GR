'use client';

import type { ArtistTier, TierSubscription } from '@gr/shared';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Grid,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconArchive,
  IconBrush,
  IconCheck,
  IconCurrencyDollar,
  IconEdit,
  IconPlus,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import { Fragment, useState } from 'react';
import { useArchiveTier, useCreateTier, useDeleteTier, useMyTiers, useTierSubscribers, useUpdateTier } from '@/api/hooks/use-payments';

export function ArtistTiers() {
  const { data: tiersData, isLoading: tiersLoading } = useMyTiers();
  const { data: subsData } = useTierSubscribers();

  const createTier = useCreateTier();
  const updateTier = useUpdateTier();
  const deleteTier = useDeleteTier();
  const archiveTier = useArchiveTier();

  const [opened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingTier, setEditingTier] = useState<ArtistTier | null>(null);
  const [showSubs, setShowSubs] = useState<{ [key: string]: boolean }>({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 1,
    benefits: '',
    maxMembers: '',
    parentTierId: '' as string | null,
  });

  const tiers = tiersData?.data || [];
  const activeTiers = tiers.filter(t => !t.isArchived);
  const subscribers = (subsData?.data || []) as TierSubscription[];

  const getSubscribersForTier = (tierId: string) => {
    return subscribers.filter(s => s.tierId === tierId);
  };

  const getActiveSubscriberCount = (tierId: string) => {
    return getSubscribersForTier(tierId).filter(s => s.status === 'ACTIVE').length;
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleOpenCreate = () => {
    setEditingTier(null);
    setFormData({ name: '', description: '', price: 1, benefits: '', maxMembers: '', parentTierId: null });
    openModal();
  };

  const handleOpenEdit = (tier: ArtistTier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      description: tier.description || '',
      price: tier.price,
      benefits: tier.benefits.join('\n'),
      maxMembers: tier.maxMembers?.toString() || '',
      parentTierId: tier.parentTierId || null,
    });
    openModal();
  };

  const handleSubmit = () => {
    const benefits = formData.benefits
      .split('\n')
      .map(b => b.trim())
      .filter(Boolean);

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      price: formData.price,
      benefits,
      maxMembers: formData.maxMembers ? Number.parseInt(formData.maxMembers) : undefined,
      parentTierId: formData.parentTierId || undefined,
    };

    if (editingTier) {
      updateTier.mutate({ tierId: editingTier.id, data });
    } else {
      createTier.mutate(data);
    }
    closeModal();
  };

  const handleDelete = (tierId: string) => {
    if (getActiveSubscriberCount(tierId) > 0) {
      notifications.show({
        color: 'yellow',
        message: 'Cannot delete a tier with active subscribers. Archive it instead.',
      });
      return;
    }

    notifications.show({
      color: 'yellow',
      message: 'Deleting tier immediately. Subscribers on this tier may be impacted.',
    });
    deleteTier.mutate(tierId);
  };

  const handleArchive = (tierId: string) => {
    notifications.show({
      color: 'blue',
      message: 'Archiving tier. New users won\'t be able to subscribe.',
    });
    archiveTier.mutate(tierId);
  };

  const parentTierOptions = tiers
    .filter(t => !t.isArchived && t.id !== editingTier?.id)
    .map(t => ({ value: t.id, label: `${t.name} (${formatCurrency(t.price)})` }));

  return (
    <Stack gap="xl">
      <Box pb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Box>
            <Title order={2} mb="xs">
              Artist Tiers
            </Title>
            <Text c="dimmed" size="sm">
              Create subscription tiers for your fans. Users subscribe monthly to support you.
            </Text>
          </Box>
          <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
            Create Tier
          </Button>
        </Group>
      </Box>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="lg" p="md">
            <Group gap="xs">
              <IconCurrencyDollar size={20} color="var(--mantine-color-green-6)" />
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Total Revenue
                </Text>
                <Text fw={700} size="lg">
                  {formatCurrency(
                    subscribers.reduce((sum, s) => {
                      const tier = tiers.find(t => t.id === s.tierId);
                      return sum + (tier?.price || 0);
                    }, 0),
                  )}
                </Text>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="lg" p="md">
            <Group gap="xs">
              <IconUsers size={20} color="var(--mantine-color-blue-6)" />
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Total Subscribers
                </Text>
                <Text fw={700} size="lg">
                  {subscribers.length}
                </Text>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="lg" p="md">
            <Group gap="xs">
              <IconBrush size={20} color="var(--mantine-color-primary-6)" />
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Active Tiers
                </Text>
                <Text fw={700} size="lg">
                  {tiers.filter(t => t.isActive).length}
                </Text>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder radius="lg" p="lg">
        <Title order={4} mb="md">
          Your Tiers
        </Title>

        {tiersLoading
          ? (
              <Text c="dimmed">Loading...</Text>
            )
          : tiers.length === 0
            ? (
                <Stack align="center" py="xl">
                  <Text c="dimmed">You haven't created any tiers yet.</Text>
                  <Button variant="light" onClick={handleOpenCreate}>
                    Create Your First Tier
                  </Button>
                </Stack>
              )
            : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Tier</Table.Th>
                      <Table.Th>Price</Table.Th>
                      <Table.Th>Benefits</Table.Th>
                      <Table.Th>Subscribers</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th ta="right">Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {activeTiers.map((tier) => {
                      const activeSubscriberCount = getActiveSubscriberCount(tier.id);
                      const deleteDisabled = activeSubscriberCount > 0;

                      return (
                        <Fragment key={tier.id}>
                          <Table.Tr>
                            <Table.Td>
                              <Text fw={500}>{tier.name}</Text>
                              {tier.description && (
                                <Text size="sm" c="dimmed">
                                  {tier.description}
                                </Text>
                              )}
                              {tier.parentTierId && (
                                <Badge variant="dot" color="blue" size="xs" mt={4}>
                                  Includes
                                  {' '}
                                  {activeTiers.find(t => t.id === tier.parentTierId)?.name || 'Lower Tier'}
                                </Badge>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Text fw={500}>
                                {formatCurrency(tier.price)}
                                /mo
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Group gap={4}>
                                {tier.benefits.slice(0, 2).map(b => (
                                  <Badge key={`${tier.id}-${b}`} variant="light" size="sm">
                                    {b}
                                  </Badge>
                                ))}
                                {tier.benefits.length > 2 && (
                                  <Badge variant="outline" size="sm">
                                    +
                                    {tier.benefits.length - 2}
                                  </Badge>
                                )}
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Button
                                variant="subtle"
                                size="xs"
                                onClick={() =>
                                  setShowSubs(prev => ({ ...prev, [tier.id]: !prev[tier.id] }))}
                              >
                                {getSubscribersForTier(tier.id).length}
                                {' '}
                                (
                                {showSubs[tier.id] ? 'hide' : 'show'}
                                )
                              </Button>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={tier.isActive ? 'green' : 'gray'} variant="light">
                                {tier.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </Table.Td>
                            <Table.Td ta="right">
                              <Group gap={4} justify="flex-end">
                                <Tooltip label="Archive (Hide from new users)">
                                  <ActionIcon
                                    variant="subtle"
                                    color="orange"
                                    size="sm"
                                    onClick={() => handleArchive(tier.id)}
                                  >
                                    <IconArchive size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Edit Tier">
                                  <ActionIcon
                                    variant="subtle"
                                    size="sm"
                                    onClick={() => handleOpenEdit(tier)}
                                  >
                                    <IconEdit size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip
                                  label={
                                    deleteDisabled
                                      ? 'Cannot delete a tier with active subscribers. Archive it instead.'
                                      : 'Delete Tier'
                                  }
                                >
                                  <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    size="sm"
                                    disabled={deleteDisabled}
                                    onClick={() => handleDelete(tier.id)}
                                  >
                                    <IconTrash size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                          <Table.Tr>
                            <Table.Td colSpan={6} p={0}>
                              <Collapse in={Boolean(showSubs[tier.id])}>
                                <Box p="md" bg="gray.0">
                                  {getSubscribersForTier(tier.id).length === 0
                                    ? (
                                        <Text c="dimmed" size="sm">
                                          No subscribers yet.
                                        </Text>
                                      )
                                    : (
                                        <Table>
                                          <Table.Thead>
                                            <Table.Tr>
                                              <Table.Th>Subscriber</Table.Th>
                                              <Table.Th>Since</Table.Th>
                                              <Table.Th>Status</Table.Th>
                                            </Table.Tr>
                                          </Table.Thead>
                                          <Table.Tbody>
                                            {getSubscribersForTier(tier.id).map(sub => (
                                              <Table.Tr key={sub.id}>
                                                <Table.Td>
                                                  <Group gap="xs">
                                                    {sub.subscriber?.avatar && (
                                                      <Box
                                                        component="img"
                                                        src={sub.subscriber.avatar}
                                                        w={24}
                                                        h={24}
                                                        style={{ borderRadius: '999px' }}
                                                      />
                                                    )}
                                                    <Text size="sm">
                                                      {sub.subscriber?.displayName
                                                        || sub.subscriber?.username}
                                                    </Text>
                                                  </Group>
                                                </Table.Td>
                                                <Table.Td>
                                                  <Text size="sm">
                                                    {formatDate(sub.createdAt)}
                                                  </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                  <Badge
                                                    color={
                                                      sub.status === 'ACTIVE'
                                                        ? 'green'
                                                        : 'gray'
                                                    }
                                                    variant="light"
                                                    size="sm"
                                                  >
                                                    {sub.status}
                                                  </Badge>
                                                </Table.Td>
                                              </Table.Tr>
                                            ))}
                                          </Table.Tbody>
                                        </Table>
                                      )}
                                </Box>
                              </Collapse>
                            </Table.Td>
                          </Table.Tr>
                        </Fragment>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              )}
      </Card>

      <Modal
        opened={opened}
        onClose={closeModal}
        title={editingTier ? 'Edit Tier' : 'Create New Tier'}
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Tier Name"
            placeholder="e.g., Supporter, Fan, Patron"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Textarea
            label="Description"
            placeholder="Describe what subscribers get..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />

          <Select
            label="Includes all benefits of (Lower Tier)"
            description="Subscribers of this tier will also get all benefits of the selected lower tier."
            placeholder="Select a lower tier to include"
            data={parentTierOptions}
            value={formData.parentTierId}
            onChange={val => setFormData({ ...formData, parentTierId: val })}
            clearable
          />

          <NumberInput
            label="Monthly Price (USD)"
            placeholder="5"
            min={1}
            max={1000}
            value={formData.price}
            onChange={val => setFormData({ ...formData, price: Number(val) })}
            disabled={!!editingTier && getSubscribersForTier(editingTier.id).length > 0}
            description={
              !!editingTier && getSubscribersForTier(editingTier.id).length > 0
                ? 'You cannot change the price because this tier already has active subscribers. Please archive this tier and create a new one instead.'
                : ''
            }
            required
          />

          <NumberInput
            label="Max Members (optional)"
            placeholder="Unlimited"
            min={1}
            value={formData.maxMembers}
            onChange={val =>
              setFormData({ ...formData, maxMembers: val?.toString() || '' })}
          />

          <Textarea
            label="Benefits (one per line)"
            placeholder="Early access to new works&#10;Behind-the-scenes content&#10;Monthly wallpapers"
            minRows={4}
            value={formData.benefits}
            onChange={e => setFormData({ ...formData, benefits: e.target.value })}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createTier.isPending || updateTier.isPending}
              leftSection={<IconCheck size={16} />}
            >
              {editingTier ? 'Save Changes' : 'Create Tier'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
