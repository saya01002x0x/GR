'use client';

import { useUser } from '@clerk/nextjs';
import { Button, Card, Group, Text, ThemeIcon } from '@mantine/core';
import { IconBrush, IconDiamond } from '@tabler/icons-react';

type Props = {
  onClick: () => void;
};

export function SketchSearchTrigger({ onClick }: Props) {
  const { isSignedIn } = useUser();

  return (
    <Card
      withBorder
      padding="sm"
      radius="md"
      mb="xl"
      style={{
        background: 'linear-gradient(45deg, rgba(255,107,107,0.1) 0%, rgba(250,82,82,0.05) 100%)',
        borderColor: 'rgba(250,82,82,0.3)',
      }}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <ThemeIcon variant="light" color="red" size="sm" radius="xl">
            <IconBrush size={14} />
          </ThemeIcon>
          <Text size="sm" fw={600} c="red.7">
            Sketch to Search
          </Text>
        </Group>
        <ThemeIcon variant="transparent" color="yellow" size="sm">
          <IconDiamond size={16} />
        </ThemeIcon>
      </Group>

      <Text size="xs" c="dimmed" mb="md">
        Draw a concept to find visually similar artworks using our AI engine.
      </Text>

      <Button
        fullWidth
        variant="gradient"
        gradient={{ from: 'red', to: 'pink', deg: 45 }}
        size="sm"
        onClick={onClick}
        leftSection={<IconBrush size={16} />}
        disabled={isSignedIn === false}
      >
        {isSignedIn === false ? 'Đăng nhập để tiếp tục' : 'Draw Now'}
      </Button>
    </Card>
  );
}
