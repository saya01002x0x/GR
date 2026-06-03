'use client';

import type { ArtworkDetail } from '@/mocks/artworkDetailData';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconCalendar,
  IconEye,
  IconUserPlus,
} from '@tabler/icons-react';

import Link from 'next/link';

type ArtworkSidebarProps = {
  artwork: ArtworkDetail;
};

export function ArtworkSidebar({ artwork }: ArtworkSidebarProps) {
  return (
    <Box
      w={320}
      style={{
        position: 'sticky',
        top: 88, // 64px header + 24px padding
        alignSelf: 'flex-start',
      }}
      visibleFrom="lg"
    >
      {/* Artist Profile Card */}
      <Card radius="lg" withBorder p="lg" mb="lg">
        <Link
          href={`/artists/${artwork.artist.username || artwork.artist.name}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Group gap="sm" mb="md" wrap="nowrap" style={{ cursor: 'pointer' }}>
            <Avatar
              src={artwork.artist.avatar}
              size={48}
              radius="xl"
              style={{ flexShrink: 0 }}
            />
            <Box flex={1} miw={0}>
              <Text size="sm" fw={700} lineClamp={1}>
                {artwork.artist.name}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {artwork.artist.role}
              </Text>
            </Box>
          </Group>
        </Link>
        <Button
          fullWidth
          radius="md"
          leftSection={<IconUserPlus size={18} />}
        >
          Follow Artist
        </Button>
      </Card>

      {/* Metadata Card */}
      <Card radius="lg" withBorder p="lg" mb="lg">
        <Title order={4} mb="sm">
          {artwork.title}
        </Title>

        <Group gap="lg" mb="md">
          <Group gap={6}>
            <IconCalendar size={16} color="var(--mantine-color-dimmed)" />
            <Text size="xs" c="dimmed">
              {artwork.createdAt}
            </Text>
          </Group>
          <Group gap={6}>
            <IconEye size={16} color="var(--mantine-color-dimmed)" />
            <Text size="xs" c="dimmed">
              {artwork.views}
              {' '}
              views
            </Text>
          </Group>
        </Group>

        <Text size="sm" lh={1.6} mb="md">
          {artwork.description}
        </Text>

        <Divider mb="md" />

        {/* Tags */}
        <Group gap="xs">
          {artwork.tags.map(tag => (
            <Badge
              key={tag}
              variant="light"
              color="gray"
              size="md"
              radius="sm"
              style={{ cursor: 'pointer' }}
            >
              {tag}
            </Badge>
          ))}
        </Group>
      </Card>

      {/* Technical Specs Card */}
      <Card radius="lg" withBorder p="lg">
        <Title order={5} mb="md">
          Technical Details
        </Title>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Original Size
            </Text>
            <Text size="sm" fw={500}>
              {artwork.specs.size}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Software
            </Text>
            <Text size="sm" fw={500}>
              {artwork.specs.software}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              License
            </Text>
            <Text size="sm" fw={500}>
              {artwork.specs.license}
            </Text>
          </Group>
        </Stack>
      </Card>
    </Box>
  );
}
