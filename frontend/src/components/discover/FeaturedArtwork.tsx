'use client';

import type { ArtworkDetail } from '@/types/artwork';
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
import Link from 'next/link';
import { useEffect, useState } from 'react';

type FeaturedArtworkProps = {
  artworks?: ArtworkDetail[];
};

export function FeaturedArtwork({ artworks = [] }: FeaturedArtworkProps) {
  const [currentArtworkIndex, setCurrentArtworkIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!artworks || artworks.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentImageIndex((prevImageIndex) => {
        const currentArtwork = artworks[currentArtworkIndex];
        const imageCount = currentArtwork?.images?.length || 1;

        if (prevImageIndex + 1 < imageCount) {
          // Move to next image in the same artwork
          return prevImageIndex + 1;
        }
        // Move to next artwork, reset image index
        setCurrentArtworkIndex(prevArtworkIndex =>
          (prevArtworkIndex + 1) % artworks.length,
        );
        return 0;
      });
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(timer);
  }, [artworks, currentArtworkIndex]);

  if (!artworks || artworks.length === 0) {
    return null; // Do not render if no featured artworks
  }

  const currentArtwork = artworks[currentArtworkIndex];
  if (!currentArtwork) {
    return null;
  }
  const images = currentArtwork.images || [];
  const currentImage = images[currentImageIndex]?.url || '';

  return (
    <Card
      mb="xl"
      p="lg"
      radius="lg"
      withBorder
      style={{ overflow: 'hidden' }}
    >
      <Group justify="space-between" mb="lg">
        <Title order={3}>Featured Artwork</Title>
      </Group>

      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap="lg"
      >
        {/* Image Carousel */}
        <Box flex={1} maw={{ base: '100%', md: 400 }}>
          <AspectRatio ratio={16 / 9}>
            <Link href={`/artworks/${currentArtwork.id}`}>
              <Image
                src={currentImage}
                alt={currentArtwork.title || 'Featured Artwork'}
                radius="md"
                style={{ cursor: 'pointer', transition: 'opacity 0.5s ease-in-out' }}
              />
            </Link>
          </AspectRatio>
        </Box>

        {/* Info */}
        <Stack flex={1} justify="center" gap="md">
          {/* Artist */}
          <Group gap="sm">
            <Avatar
              src={currentArtwork.author?.avatar || ''}
              size={40}
              radius="xl"
            />
            <Box>
              <Title order={4}>{currentArtwork.title}</Title>
              <Text size="xs" c="dimmed">
                by
                {' '}
                <Text
                  component={Link}
                  href={`/artists/${currentArtwork.author?.username || currentArtwork.author?.id}`}
                  c="primary"
                  style={{ cursor: 'pointer' }}
                >
                  {currentArtwork.author?.displayName || currentArtwork.author?.username || 'Unknown Artist'}
                </Text>
              </Text>
            </Box>
          </Group>

          {/* Description */}
          <Text size="sm" lh={1.6} lineClamp={3}>
            {currentArtwork.description || 'No description available.'}
          </Text>

          {/* Actions */}
          <Group gap="sm">
            <Button
              component={Link}
              href={`/artworks/${currentArtwork.id}`}
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
