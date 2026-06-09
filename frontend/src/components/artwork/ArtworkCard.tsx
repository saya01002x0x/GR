'use client';

import {
  ActionIcon,
  AspectRatio,
  Avatar,
  Box,
  Group,
  Text,
} from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import NextImage from 'next/image';
import { apiClient } from '@/api/client';
import { E } from '@/api/endpoints';

type ArtworkCardProps = {
  id?: string;
  title: string;
  image: string;
  artist?: string;
  artistAvatar?: string;
  rank?: number;
  liked?: boolean;
  onLikeToggle?: () => void;
  onClick?: () => void;
  /** Size variant: 'sm' for compact (~184px), 'md' for default */
  size?: 'sm' | 'md';
};

function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return '#FFD700'; // Gold
    case 2:
      return '#C0C0C0'; // Silver
    case 3:
      return '#CD7F32'; // Bronze
    default:
      return 'var(--mantine-color-gray-1)';
  }
}

export function ArtworkCard({
  id,
  title,
  image,
  artist,
  artistAvatar,
  rank,
  liked = false,
  onLikeToggle,
  onClick,
  size = 'md',
}: ArtworkCardProps) {
  const { hovered, ref } = useHover();
  const queryClient = useQueryClient();
  const isCompact = size === 'sm';

  // Fix cho Next.js Image Optimization trên Node.js >= 17 (Tránh lỗi phân giải IPv6 ::1)
  const safeImageUrl = image?.startsWith('http://localhost')
    ? image.replace('http://localhost', 'http://127.0.0.1')
    : image;

  const handleMouseEnter = () => {
    if (id) {
      queryClient.prefetchQuery({
        queryKey: ['artworks', 'detail', id],
        queryFn: () => apiClient.get(E.artworks.byId(id)),
      });
    }
  };

  return (
    <Box
      ref={ref}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
    >
      {/* Image Container */}
      <Box pos="relative" mb={isCompact ? 4 : 'xs'}>
        <AspectRatio ratio={1}>
          <Box
            pos="relative"
            w="100%"
            h="100%"
            style={{
              overflow: 'hidden',
              borderRadius: isCompact
                ? 'var(--mantine-radius-sm)'
                : 'var(--mantine-radius-md)',
            }}
          >
            <NextImage
              src={safeImageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              style={{
                objectFit: 'cover',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.3s ease',
              }}
            />
          </Box>
        </AspectRatio>

        {/* Rank Badge */}
        {rank && (
          <Box
            pos="absolute"
            top={isCompact ? 4 : 8}
            left={isCompact ? 4 : 8}
            w={isCompact ? 24 : 32}
            h={isCompact ? 24 : 32}
            style={{
              backgroundColor: getRankColor(rank),
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--mantine-shadow-md)',
              zIndex: 10,
            }}
          >
            <Text fw={700} fz={isCompact ? 'xs' : 'sm'} c="dark">
              {rank}
            </Text>
          </Box>
        )}

        {/* Like Button (shown on hover) */}
        {onLikeToggle && (
          <ActionIcon
            pos="absolute"
            top={isCompact ? 4 : 8}
            right={isCompact ? 4 : 8}
            radius="xl"
            size={isCompact ? 'sm' : 'md'}
            variant="filled"
            color="dark"
            style={{
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.2s ease',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onLikeToggle();
            }}
          >
            {liked
              ? (
                  <IconHeartFilled size={isCompact ? 12 : 16} color="white" />
                )
              : (
                  <IconHeart size={isCompact ? 12 : 16} color="white" />
                )}
          </ActionIcon>
        )}

        {/* Hover Overlay */}
        <Box
          pos="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          style={{
            backgroundColor: hovered ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
            transition: 'background-color 0.2s ease',
            borderRadius: isCompact ? 'var(--mantine-radius-sm)' : 'var(--mantine-radius-md)',
            pointerEvents: 'none',
          }}
        />
      </Box>

      {/* Title */}
      <Text
        fw={600}
        fz={isCompact ? 'xs' : 'sm'}
        lineClamp={1}
        c={hovered ? 'primary' : undefined}
        style={{ transition: 'color 0.2s ease' }}
      >
        {title}
      </Text>

      {/* Artist Info */}
      {artist && (
        <Group gap={isCompact ? 4 : 'xs'} mt={2}>
          {artistAvatar && !isCompact && (
            <Avatar src={artistAvatar} size={16} radius="xl" />
          )}
          <Text size="xs" c="dimmed" lineClamp={1}>
            {artistAvatar && !isCompact ? artist : `by ${artist}`}
          </Text>
        </Group>
      )}
    </Box>
  );
}
