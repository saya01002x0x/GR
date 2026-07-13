'use client';

import type { RisingStar } from '@/mocks/discoverData';
import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Card,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import Link from 'next/link';

type SidebarContentProps = {
  risingStars: RisingStar[];
  popularTags: string[];
};

export function SidebarContent({ risingStars, popularTags }: SidebarContentProps) {
  return (
    <Box
      w={288}
      style={{
        position: 'sticky',
        top: 88, // 64px header + 24px padding
        alignSelf: 'flex-start',
      }}
      visibleFrom="lg"
    >
      {/* Rising Stars */}
      <Card radius="lg" withBorder p="lg" mb="lg">
        <Group justify="space-between" mb="md">
          <Title order={5}>Rising Stars</Title>
        </Group>

        <Stack gap="md">
          {risingStars.map((star: any) => (
            <Link key={star.id} href={`/artists/${star.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Group gap="sm" wrap="nowrap" style={{ cursor: 'pointer' }}>
                <Avatar
                  src={star.avatar}
                  size={40}
                  radius="xl"
                  style={{ flexShrink: 0 }}
                />
                <Box flex={1} miw={0}>
                  <Text size="sm" fw={700} lineClamp={1}>
                    {star.displayName || star.username || star.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {star.followerCount ?? star.followers ?? 0}
                    {' '}
                    Followers
                  </Text>
                </Box>
              </Group>
            </Link>
          ))}
        </Stack>
      </Card>

      {/* Popular Tags */}
      <Box mb="xl">
        <Title order={5} mb="sm">
          Popular Tags
        </Title>
        <Group gap="xs">
          {popularTags.map(tag => (
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
      </Box>

      {/* Footer Links */}
      <Box>
        <Group gap="md" mb="sm">
          <Anchor href="#" size="xs" c="dimmed">
            About
          </Anchor>
          <Anchor href="#" size="xs" c="dimmed">
            Terms
          </Anchor>
          <Anchor href="#" size="xs" c="dimmed">
            Privacy
          </Anchor>
          <Anchor href="#" size="xs" c="dimmed">
            Help
          </Anchor>
        </Group>
        <Text size="xs" c="dimmed">
          © 2024 ArtStation Clone.
        </Text>
      </Box>
    </Box>
  );
}
