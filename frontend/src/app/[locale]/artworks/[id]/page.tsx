'use client';

import type { ArtworkDetail as APIArtworkDetail, ArtworkDetailResponse, ArtworkListItem, RelatedArtworksResponse } from '@/types/artwork';
import { Box, Center, Flex, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  ArtworkActions,
  ArtworkImage,
  ArtworkSidebar,
  CommentsSection,
  RelatedArtworks,
} from '@/components/artwork-detail';
import { mockComments } from '@/mocks/artworkDetailData';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Transform API artwork to component format
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
      role: 'Artist', // TODO: Add role to user model
    },
    specs: {
      size: artwork.images[0] ? `${artwork.images[0].width} x ${artwork.images[0].height} px` : 'Unknown',
      software: 'Unknown', // TODO: Add software field
      license: 'All Rights Reserved', // TODO: Add license field
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

// Transform related artworks
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

  const [artwork, setArtwork] = useState<APIArtworkDetail | null>(null);
  const [relatedArtworks, setRelatedArtworks] = useState<ArtworkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch artwork detail
  const fetchArtwork = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/artworks/${artworkId}`);
      const response: ArtworkDetailResponse = await res.json();

      if (!response.data) {
        setError('Artwork not found');
        return;
      }

      setArtwork(response.data);

      // Fetch related artworks
      const relatedRes = await fetch(`${API_URL}/artworks/${artworkId}/related?limit=6`);
      const relatedResponse: RelatedArtworksResponse = await relatedRes.json();
      setRelatedArtworks(relatedResponse.data || []);
    } catch (err) {
      console.error('Failed to fetch artwork:', err);
      setError('Failed to load artwork');
    } finally {
      setLoading(false);
    }
  }, [artworkId]);

  useEffect(() => {
    if (artworkId) {
      fetchArtwork();
    }
  }, [artworkId, fetchArtwork]);

  // Loading state
  if (loading) {
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

  // Error state
  if (error || !artwork) {
    return (
      <Box maw={1400} mx="auto" px={{ base: 'md', md: 'xl' }} py="xl">
        <Center h={400}>
          <Stack align="center" gap="md">
            <IconPhoto size={64} color="var(--mantine-color-dimmed)" />
            <Title order={2}>{error || 'Artwork not found'}</Title>
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
        {/* Left Column - Main Content */}
        <Box flex={1} miw={0}>
          {/* Artwork Image */}
          <ArtworkImage
            src={artwork.images[0]?.url || ''}
            alt={artwork.title}
          />

          {/* Action Bar */}
          <ArtworkActions likes={artwork.likeCount || 0} />

          {/* Comments Section - using mock for now */}
          <CommentsSection
            comments={mockComments}
            totalCount={mockComments.length}
          />
        </Box>

        {/* Right Column - Sidebar */}
        <ArtworkSidebar artwork={transformedArtwork} />
      </Flex>

      {/* Related Artworks */}
      {transformedRelated.length > 0 && (
        <RelatedArtworks artworks={transformedRelated} />
      )}
    </Box>
  );
}
