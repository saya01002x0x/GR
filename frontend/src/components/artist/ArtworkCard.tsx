'use client';

import type { ArtworkListItem } from '@/types/artwork';
import {
  Box,
  Group,
  Image,
  Text,
} from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { IconHeart } from '@tabler/icons-react';
import Link from 'next/link';
import { formatNumber } from '@/mocks/artistData';

type ArtworkCardProps = {
  artwork: ArtworkListItem;
};

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const { hovered, ref } = useHover();

  return (
    <Box
      component={Link}
      href={`/artworks/${artwork.id}`}
      ref={ref}
      className="masonry-item"
      pos="relative"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'block',
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      {/* Artwork Image */}
      <Image
        src={artwork.images?.[0]?.thumbnailUrl || artwork.images?.[0]?.url}
        alt={artwork.title}
        radius="md"
      />

      {/* WIP Badge */}
      {/*
      {artwork.isWip && (
        <Badge
          pos="absolute"
          top={4}
          right={4}
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
      */}

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
          padding: 'var(--mantine-spacing-sm)',
        }}
      >
        <Text fw={600} fz="xs" c="white" lineClamp={1}>
          {artwork.title}
        </Text>
        <Group gap={4} mt={4}>
          <Text size="xs" c="gray.4">
            {new Date(artwork.createdAt).toLocaleDateString()}
          </Text>
          <Box flex={1} />
          <IconHeart size={12} color="white" />
          <Text size="xs" c="white" fw={700}>
            {formatNumber(0 /* artwork.likeCount */)}
          </Text>
        </Group>
      </Box>
    </Box>
  );
}
