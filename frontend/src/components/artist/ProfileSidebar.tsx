'use client';

import type { Artist } from '@/mocks/artistData';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconBrandInstagram,
  IconBrandX,
  IconLink,
  IconMail,
  IconMapPin,
  IconPlus,
} from '@tabler/icons-react';
import { formatNumber } from '@/mocks/artistData';

type ProfileSidebarProps = {
  artist: Artist;
};

export function ProfileSidebar({ artist }: ProfileSidebarProps) {
  return (
    <Stack gap="md" w={{ base: '100%', lg: 320 }} style={{ flexShrink: 0 }}>
      {/* Identity Card */}
      <Card shadow="sm" radius="lg" p="lg" withBorder style={{ overflow: 'visible' }}>
        <Stack align="center" ta="center">
          {/* Avatar */}
          <Avatar
            src={artist.avatar}
            alt={artist.displayName}
            size={128}
            radius="50%"
            style={{
              border: '4px solid var(--mantine-color-body)',
              boxShadow: 'var(--mantine-shadow-md)',
              marginTop: -80,
            }}
          />

          {/* Name & Username */}
          <Title order={2} fw={700}>
            {artist.displayName}
          </Title>
          <Text c="dimmed" size="sm" fw={500} mt={-8}>
            @
            {artist.username}
          </Text>

          {/* Badges */}
          <Group gap="xs" justify="center" my="xs">
            {artist.badges.map(badge => (
              <Badge
                key={badge.label}
                variant={badge.variant === 'primary' ? 'light' : 'default'}
                color={badge.variant === 'primary' ? 'primary' : 'gray'}
                size="sm"
                tt="uppercase"
                fw={700}
              >
                {badge.label}
              </Badge>
            ))}
          </Group>

          {/* Action Buttons */}
          <Group w="100%" gap="sm" mt="sm">
            <Button
              flex={1}
              radius="md"
              leftSection={<IconPlus size={18} />}
            >
              Follow
            </Button>
            <Button
              flex={1}
              radius="md"
              variant="default"
              leftSection={<IconMail size={18} />}
            >
              Message
            </Button>
          </Group>
        </Stack>

        <Divider my="lg" />

        {/* Bio */}
        <Stack gap="sm">
          <Text size="sm" lh={1.6}>
            {artist.bio}
          </Text>

          <Group gap="xs" c="dimmed">
            <IconLink size={18} />
            <Anchor href={`https://${artist.website}`} size="sm" c="dimmed">
              {artist.website}
            </Anchor>
          </Group>

          <Group gap="xs" c="dimmed">
            <IconMapPin size={18} />
            <Text size="sm">{artist.location}</Text>
          </Group>
        </Stack>

        {/* Social Links */}
        <Group gap="sm" mt="lg" justify="center">
          {artist.socials.twitter && (
            <ActionIcon
              component="a"
              href={artist.socials.twitter}
              variant="default"
              radius="xl"
              size="lg"
            >
              <IconBrandX size={16} />
            </ActionIcon>
          )}
          {artist.socials.instagram && (
            <ActionIcon
              component="a"
              href={artist.socials.instagram}
              variant="default"
              radius="xl"
              size="lg"
            >
              <IconBrandInstagram size={16} />
            </ActionIcon>
          )}
        </Group>
      </Card>

      {/* Stats */}
      <SimpleGrid cols={3} spacing="xs">
        <Paper withBorder p="sm" radius="md" ta="center">
          <Text fw={700} fz="lg">
            {formatNumber(artist.stats.followers)}
          </Text>
          <Text size="xs" c="dimmed">
            Followers
          </Text>
        </Paper>
        <Paper withBorder p="sm" radius="md" ta="center">
          <Text fw={700} fz="lg">
            {formatNumber(artist.stats.following)}
          </Text>
          <Text size="xs" c="dimmed">
            Following
          </Text>
        </Paper>
        <Paper withBorder p="sm" radius="md" ta="center">
          <Text fw={700} fz="lg">
            {formatNumber(artist.stats.views)}
          </Text>
          <Text size="xs" c="dimmed">
            Views
          </Text>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
