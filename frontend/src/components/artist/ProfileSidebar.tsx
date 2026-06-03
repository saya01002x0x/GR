'use client';

import {
  Avatar,
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
  IconMail,
  IconPlus,
} from '@tabler/icons-react';
import { formatNumber } from '@/mocks/artistData';

export type PublicArtistDetail = {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
  createdAt: string;
  _count: { artworks: number; followers: number };
  isOwner: boolean;
  tiers: any[];
  accessibleTierIds: string[];
  artworkCounts: { all: number; free: number; tiers: Record<string, number> };
};

type ProfileSidebarProps = {
  artist: PublicArtistDetail;
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
            alt={artist.displayName || artist.username}
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
            {artist.displayName || artist.username}
          </Title>
          <Text c="dimmed" size="sm" fw={500} mt={-8}>
            @
            {artist.username}
          </Text>

          {/* Badges */}
          {/*
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
          */}

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

          {/*
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
          */}
        </Stack>

        {/* Social Links */}
        {/*
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
        */}
      </Card>

      {/* Stats */}
      <SimpleGrid cols={2} spacing="xs">
        <Paper withBorder p="sm" radius="md" ta="center">
          <Text fw={700} fz="lg">
            {formatNumber(artist._count.followers)}
          </Text>
          <Text size="xs" c="dimmed">
            Followers
          </Text>
        </Paper>
        <Paper withBorder p="sm" radius="md" ta="center">
          <Text fw={700} fz="lg">
            {formatNumber(artist._count.artworks)}
          </Text>
          <Text size="xs" c="dimmed">
            Artworks
          </Text>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
