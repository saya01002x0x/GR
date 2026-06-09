'use client';

import { Avatar, Box, Button, Card, Group, Loader, Pagination, Stack, Text } from '@mantine/core';
import Link from 'next/link';
import { useFollow } from '@/api/hooks';

function FollowUserCard({ user }: { user: any }) {
  const { isFollowing, toggleFollow, isToggling } = useFollow(user.id);

  return (
    <Card withBorder p="md" radius="md">
      <Group justify="space-between" wrap="nowrap">
        <Link href={`/artists/${user.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Group wrap="nowrap" style={{ cursor: 'pointer' }}>
            <Avatar src={user.avatar} size="md" radius="xl" />
            <Box>
              <Text size="sm" fw={500} lineClamp={1}>
                {user.displayName || user.username}
              </Text>
              <Text size="xs" c="dimmed">
                @
                {user.username}
              </Text>
            </Box>
          </Group>
        </Link>
        <Button
          size="xs"
          variant={isFollowing ? 'light' : 'filled'}
          onClick={toggleFollow}
          loading={isToggling}
        >
          {isFollowing ? 'Following ✓' : 'Follow'}
        </Button>
      </Group>
    </Card>
  );
}

export function FollowList({ type, items, total, page, limit, isLoading, onPageChange }: any) {
  if (isLoading) {
    return (
      <Box ta="center" py="xl">
        <Loader size="md" />
      </Box>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Box ta="center" py="xl">
        <Text c="dimmed">
          {type === 'followers' ? 'You do not have any followers yet.' : 'You are not following anyone.'}
        </Text>
      </Box>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <Stack gap="md">
      {items.map((user: any) => (
        <FollowUserCard key={user.id} user={user} />
      ))}
      {totalPages > 1 && (
        <Group justify="center" mt="md">
          <Pagination total={totalPages} value={page} onChange={onPageChange} />
        </Group>
      )}
    </Stack>
  );
}
