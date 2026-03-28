'use client';

import type { FeaturedArtworkData } from '@/mocks/discoverData';
import {
  ActionIcon,
  AspectRatio,
  Avatar,
  Box,
  Button,
  Card,
  Flex,
  Group,
  Image,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconEye, IconHeart } from '@tabler/icons-react';

type FeaturedArtworkProps = {
  artwork: FeaturedArtworkData;
};

export function FeaturedArtwork({ artwork }: FeaturedArtworkProps) {
  return (
    <Card
      mb="xl"
      p="lg"
      radius="lg"
      withBorder
    >
      <Group justify="space-between" mb="lg">
        <Title order={3}>Featured Artwork</Title>
      </Group>

      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap="lg"
      >
        {/* Image */}
        <Box flex={1} maw={{ base: '100%', md: 400 }}>
          <AspectRatio ratio={16 / 9}>
            <Image
              src={artwork.image}
              alt={artwork.title}
              radius="md"
              style={{ cursor: 'pointer' }}
            />
          </AspectRatio>
        </Box>

        {/* Info */}
        <Stack flex={1} justify="center" gap="md">
          {/* Artist */}
          <Group gap="sm">
            <Avatar
              src={artwork.artist.avatar}
              size={40}
              radius="xl"
            />
            <Box>
              <Title order={4}>{artwork.title}</Title>
              <Text size="xs" c="dimmed">
                by
                {' '}
                <Text
                  component="span"
                  c="primary"
                  style={{ cursor: 'pointer' }}
                >
                  {artwork.artist.name}
                </Text>
              </Text>
            </Box>
          </Group>

          {/* Description */}
          <Text size="sm" lh={1.6}>
            {artwork.description}
          </Text>

          {/* Actions */}
          <Group gap="sm">
            <Button
              leftSection={<IconEye size={18} />}
              radius="md"
            >
              View Artwork
            </Button>
            <ActionIcon
              variant="default"
              size="lg"
              radius="md"
            >
              <IconHeart size={18} />
            </ActionIcon>
          </Group>
        </Stack>
      </Flex>
    </Card>
  );
}
