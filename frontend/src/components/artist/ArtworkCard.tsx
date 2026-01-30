'use client';

import type { Artwork } from '@/mocks/artistData';
import {
  Badge,
  Box,
  Group,
  Image,
  Text,
  Title,
} from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { IconHeart } from '@tabler/icons-react';
import { formatNumber } from '@/mocks/artistData';

type ArtworkCardProps = {
  artwork: Artwork;
};

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const { hovered, ref } = useHover();

  return (
    <Box
      ref={ref}
      className="masonry-item"
      pos="relative"
      style={{
        borderRadius: 'var(--mantine-radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Artwork Image */}
      <Image
        src={artwork.image}
        alt={artwork.title}
        radius="lg"
      />

      {/* WIP Badge */}
      {artwork.isWip && (
        <Badge
          pos="absolute"
          top={8}
          right={8}
          variant="filled"
          color="dark"
          size="xs"
          tt="uppercase"
          fw={700}
          style={{
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }}
        >
          WIP
        </Badge>
      )}

      {/* Hover Overlay */}
      <Box
        pos="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent, transparent)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 'var(--mantine-spacing-md)',
        }}
      >
        <Title order={4} c="white" fw={700} lineClamp={1}>
          {artwork.title}
        </Title>
        <Group gap="xs" mt="xs">
          <Text size="xs" c="gray.4">
            {artwork.timeAgo}
          </Text>
          <Box flex={1} />
          <IconHeart size={16} color="white" />
          <Text size="xs" c="white" fw={700}>
            {formatNumber(artwork.likes)}
          </Text>
        </Group>
      </Box>
    </Box>
  );
}
