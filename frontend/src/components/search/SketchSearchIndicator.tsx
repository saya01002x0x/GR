'use client';

import { Box, CloseButton, Group, Image, Text } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

type Props = {
  base64Image: string;
  onClear: () => void;
};

export function SketchSearchIndicator({ base64Image, onClear }: Props) {
  return (
    <Box
      mb="xl"
      p="xs"
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 'var(--mantine-radius-md)',
        backgroundColor: 'var(--mantine-color-default)',
        display: 'inline-block',
      }}
    >
      <Group gap="md">
        <Group gap="xs">
          <IconSearch size={20} color="var(--mantine-color-dimmed)" />
          <Text size="sm" fw={500}>
            Searching by Sketch
          </Text>
        </Group>

        <Box
          style={{
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-sm)',
            overflow: 'hidden',
            width: 60,
            height: 40,
            backgroundColor: 'white',
          }}
        >
          <Image src={base64Image} w="100%" h="100%" fit="contain" alt="Sketch thumbnail" />
        </Box>

        <CloseButton onClick={onClear} title="Clear sketch search" />
      </Group>
    </Box>
  );
}
