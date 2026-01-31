'use client';

import type { ArtworkListItem, ArtworksListResponse } from '@/types/artwork';
import { Box, Flex, Skeleton, Stack, Text, Title } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import {
  CategoryPills,
  DiscoverGrid,
  FeaturedArtwork,
  HeroSection,
  RankingSection,
  SidebarContent,
} from '@/components/discover';
import {
  categories,
  featuredArtwork,
  featuredItems,
  popularTags,
  rankingArtworks,
  rankingTabs,
  risingStars,
} from '@/mocks/discoverData';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DiscoverPage() {
  const [artworks, setArtworks] = useState<ArtworkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Fetch artworks from API
  const fetchArtworks = useCallback(async (currentOffset: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      }

      const res = await fetch(`${API_URL}/artworks?limit=25&offset=${currentOffset}`);

      if (res.ok) {
        const response: ArtworksListResponse = await res.json();

        if (append) {
          setArtworks(prev => [...prev, ...response.data]);
        } else {
          setArtworks(response.data);
        }

        setHasMore(response.pagination.hasMore);
        setOffset(currentOffset + response.data.length);
      }
    } catch (error) {
      console.error('Failed to fetch artworks:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchArtworks(0);
  }, [fetchArtworks]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchArtworks(offset, true);
    }
  }, [fetchArtworks, loadingMore, hasMore, offset]);

  // Transform API data to component format
  const discoverArtworks = artworks.map(artwork => ({
    id: artwork.id,
    title: artwork.title,
    artist: {
      name: artwork.author.displayName || artwork.author.username,
      avatar: artwork.author.avatar || '',
    },
    image: artwork.images[0]?.url || artwork.images[0]?.thumbnailUrl || '',
    liked: false, // TODO: implement liked state
  }));

  return (
    <Box maw={1600} mx="auto">
      {/* Hero Section */}
      <HeroSection items={featuredItems} />

      {/* Category Pills */}
      <CategoryPills categories={categories} />

      {/* Main Content with Sidebar */}
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        gap="xl"
        px={{ base: 'md', md: 'xl' }}
        pb="xl"
      >
        {/* Main Content */}
        <Box flex={1} miw={0}>
          {/* Ranking Section */}
          <RankingSection tabs={rankingTabs} artworks={rankingArtworks} />

          {/* Featured Artwork */}
          <FeaturedArtwork artwork={featuredArtwork} />

          {/* Discover Grid - Real Data */}
          {loading
            ? (
                <Box>
                  <Title order={3} mb="lg">
                    Discover New Art
                  </Title>
                  <Stack gap="md">
                    <Skeleton h={200} radius="md" />
                    <Skeleton h={150} radius="md" />
                    <Skeleton h={180} radius="md" />
                    <Skeleton h={160} radius="md" />
                  </Stack>
                </Box>
              )
            : discoverArtworks.length === 0
              ? (
                  <Box>
                    <Title order={3} mb="lg">
                      Discover New Art
                    </Title>
                    <Text c="dimmed" ta="center" py="xl">
                      No artworks yet. Be the first to upload!
                    </Text>
                  </Box>
                )
              : (
                  <DiscoverGrid
                    artworks={discoverArtworks}
                    onLoadMore={hasMore ? handleLoadMore : undefined}
                    loading={loadingMore}
                  />
                )}
        </Box>

        {/* Sidebar */}
        <SidebarContent
          risingStars={risingStars}
          popularTags={popularTags}
        />
      </Flex>
    </Box>
  );
}
