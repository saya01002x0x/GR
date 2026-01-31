'use client';

import type { UserProfile } from '@/mocks/dashboardData';
import {
  Card,
  Group,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';

type ProfileVisibilityProps = {
  visibility: UserProfile['visibility'];
  onChange: (visibility: UserProfile['visibility']) => void;
};

export function ProfileVisibility({ visibility, onChange }: ProfileVisibilityProps) {
  const handleToggle = (key: keyof UserProfile['visibility']) => {
    onChange({ ...visibility, [key]: !visibility[key] });
  };

  return (
    <Card withBorder radius="lg" p="lg">
      <Title order={4} mb="lg">
        Profile Visibility
      </Title>

      <Stack gap="lg">
        <Group justify="space-between" wrap="nowrap">
          <div>
            <Text size="sm" fw={500}>
              Show &quot;Liked&quot; Artworks
            </Text>
            <Text size="xs" c="dimmed">
              Allow others to see artworks you&apos;ve liked
            </Text>
          </div>
          <Switch
            checked={visibility.showLikedArtworks}
            onChange={() => handleToggle('showLikedArtworks')}
          />
        </Group>

        <Group justify="space-between" wrap="nowrap">
          <div>
            <Text size="sm" fw={500}>
              Display Follower Count
            </Text>
            <Text size="xs" c="dimmed">
              Show your follower count on your profile
            </Text>
          </div>
          <Switch
            checked={visibility.displayFollowerCount}
            onChange={() => handleToggle('displayFollowerCount')}
          />
        </Group>

        <Group justify="space-between" wrap="nowrap">
          <div>
            <Text size="sm" fw={500}>
              Allow Direct Messages
            </Text>
            <Text size="xs" c="dimmed">
              Let other users send you direct messages
            </Text>
          </div>
          <Switch
            checked={visibility.allowDirectMessages}
            onChange={() => handleToggle('allowDirectMessages')}
          />
        </Group>
      </Stack>
    </Card>
  );
}
