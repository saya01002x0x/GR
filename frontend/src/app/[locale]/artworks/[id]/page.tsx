'use client';

import type { ArtworkDetail as APIArtworkDetail, ArtworkListItem } from '@/types/artwork';
import { Box, Center, Flex, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useArtwork } from '@/api/hooks';
import {
  ArtworkActions,
  ArtworkImageGallery,
  ArtworkSidebar,
  CommentsSection,
  RelatedArtworks,
} from '@/components/artwork-detail';

function transformArtworkForSidebar(artwork: APIArtworkDetail) {
  return {
    id: artwork.id,
    title: artwork.title,
    image: artwork.images[0]?.url || '',
    likes: artwork.likeCount || 0,
    views: formatNumber(artwork.viewCount || 0),
    createdAt: new Date(artwork.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    description: artwork.description || '',
    tags: artwork.tags.map(t => `#${t.tag.name}`),
    artist: {
      id: artwork.author.id,
      name: artwork.author.displayName || artwork.author.username,
      avatar: artwork.author.avatar || '',
      role: 'Artist',
    },
    specs: {
      size: artwork.images[0] ? `${artwork.images[0].width} x ${artwork.images[0].height} px` : 'Unknown',
      software: 'Unknown',
      license: 'All Rights Reserved',
    },
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

function transformRelatedArtworks(artworks: ArtworkListItem[]) {
  return artworks.map(artwork => ({
    id: artwork.id,
    title: artwork.title,
    image: artwork.images[0]?.thumbnailUrl || artwork.images[0]?.url || '',
    artist: artwork.author.displayName || artwork.author.username,
  }));
}

export default function ArtworkDetailPage() {
  const params = useParams();
  const artworkId = params.id as string;

  const { artwork, relatedArtworks, isLoading, error } = useArtwork(artworkId);

  if (isLoading) {
    return (
      <Box maw={1400} mx="auto" px={{ base: 'md', md: 'xl' }} py="xl">
        <Flex direction={{ base: 'column', lg: 'row' }} gap="xl">
          <Box flex={1}>
            <Skeleton h={500} radius="lg" mb="xl" />
            <Skeleton h={60} radius="md" mb="xl" />
            <Skeleton h={200} radius="md" />
          </Box>
          <Box w={320} visibleFrom="lg">
            <Skeleton h={150} radius="lg" mb="lg" />
            <Skeleton h={250} radius="lg" mb="lg" />
            <Skeleton h={150} radius="lg" />
          </Box>
        </Flex>
      </Box>
    );
  }

  if (error || !artwork) {
    return (
      <Box maw={1400} mx="auto" px={{ base: 'md', md: 'xl' }} py="xl">
        <Center h={400}>
          <Stack align="center" gap="md">
            <IconPhoto size={64} color="var(--mantine-color-dimmed)" />
            <Title order={2}>{error?.message || 'Artwork not found'}</Title>
            <Text c="dimmed">The artwork you&apos;re looking for doesn&apos;t exist or has been removed.</Text>
            <Link href="/discover">
              <Text c="primary" fw={600}>← Back to Discover</Text>
            </Link>
          </Stack>
        </Center>
      </Box>
    );
  }

  const transformedArtwork = transformArtworkForSidebar(artwork);
  const transformedRelated = transformRelatedArtworks(relatedArtworks);

  return (
    <Box maw={1400} mx="auto" px={{ base: 'md', md: 'xl' }} py="xl">
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        gap="xl"
      >
        <Box flex={1} miw={0}>
          <ArtworkImageGallery
            images={artwork.images}
            alt={artwork.title}
          />

          <ArtworkActions
            artworkId={artworkId}
            initialLikeCount={artwork.likeCount || 0}
          />

          <CommentsSection artworkId={artworkId} />
        </Box>

        <ArtworkSidebar artwork={transformedArtwork} />
      </Flex>

      {transformedRelated.length > 0 && (
        <RelatedArtworks artworks={transformedRelated} />
      )}
    </Box>
  );
}
