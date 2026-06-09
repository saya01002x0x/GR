'use client';

import type { ArtworkListItem } from '@/types/artwork';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Image,
  Menu,
  Text,
} from '@mantine/core';
import {
  IconDots,
  IconFlag,
  IconHeart,
  IconHeartFilled,
  IconMessageCircle,
  IconShare,
  IconUserX,
  IconVolumeOff,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import { useLike } from '@/api/hooks';

type FeedArtworkCardProps = {
  artwork: ArtworkListItem;
  locale: string;
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

export function FeedArtworkCard({ artwork, locale }: FeedArtworkCardProps) {
  const { liked, likeCount, toggleLike } = useLike(artwork.id);
  const [expanded, setExpanded] = useState(false);

  const authorName
    = artwork.author?.displayName || artwork.author?.username || 'Unknown Artist';
  const authorAvatar = artwork.author?.avatar || undefined;
  const image = artwork.images?.[0];
  const imagePreview
    = image?.thumbnailUrl || image?.url || '';

  // Determine if image is very tall (e.g., Webtoon format)
  // If aspectRatio is not provided, calculate it. 0.8 is roughly 4:5. Less than 0.7 is tall.
  const aspectRatio
    = image?.aspectRatio
      || (image && image.height > 0 ? image.width / image.height : undefined)
      || 1;
  const isTallImage = aspectRatio < 0.7;

  return (
    <Box
      bg="var(--mantine-color-body)"
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 'var(--mantine-radius-md)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Group p="md" justify="space-between">
        <Group
          gap="sm"
          renderRoot={props => (
            <Link
              {...props}
              href={`/${locale}/users/${artwork.author.username || artwork.author.id}`}
            />
          )}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Avatar src={authorAvatar} alt={authorName} radius="xl" size="md" />
          <div>
            <Text size="sm" fw={600}>
              {authorName}
            </Text>
            <Text size="xs" c="dimmed">
              {new Date(artwork.createdAt).toLocaleDateString()}
            </Text>
          </div>
        </Group>

        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size={20} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconUserX size={16} />}>
              Unfollow
              {' '}
              {authorName}
            </Menu.Item>
            <Menu.Item leftSection={<IconVolumeOff size={16} />}>
              Mute this post
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconFlag size={16} />}>
              Report
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Body / Title */}
      <Box px="md" pb="md">
        <Text fw={600} size="lg">
          {artwork.title}
        </Text>
        {artwork.description && (
          <Text size="sm" c="dimmed" lineClamp={2} mt={4}>
            {artwork.description}
          </Text>
        )}
      </Box>

      {/* Media */}
      <Box style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <Box
          style={{
            maxHeight: expanded || !isTallImage ? 'none' : '70vh',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Link
            href={`/${locale}/artworks/${artwork.id}`}
            style={{ display: 'block', width: '100%' }}
          >
            <Image
              src={imagePreview}
              alt={artwork.title}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </Link>

          {!expanded && isTallImage && (
            <Box
              pos="absolute"
              bottom={0}
              left={0}
              right={0}
              h={160}
              style={{
                background:
                  'linear-gradient(to top, var(--mantine-color-body) 0%, rgba(255,255,255,0) 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: 'var(--mantine-spacing-xl)',
                pointerEvents: 'none',
              }}
            >
              <Button
                variant="default"
                size="md"
                radius="xl"
                style={{
                  pointerEvents: 'auto',
                  boxShadow: 'var(--mantine-shadow-md)',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExpanded(true);
                }}
              >
                View full image
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Actions */}
      <Group p="md" gap="xl">
        <Group
          gap="xs"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.preventDefault();
            toggleLike();
          }}
        >
          {liked
            ? (
                <IconHeartFilled size={24} color="red" />
              )
            : (
                <IconHeart size={24} />
              )}
          <Text fw={600} size="sm">
            {formatNumber(likeCount || 0)}
          </Text>
        </Group>

        <Group
          gap="xs"
          renderRoot={props => (
            <Link
              {...props}
              href={`/${locale}/artworks/${artwork.id}`}
            />
          )}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <IconMessageCircle size={24} />
          <Text fw={600} size="sm">
            Comment
          </Text>
        </Group>

        <ActionIcon variant="subtle" color="gray" size="lg" ml="auto">
          <IconShare size={24} />
        </ActionIcon>
      </Group>
    </Box>
  );
}
