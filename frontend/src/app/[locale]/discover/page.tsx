'use client';

import { Box, Flex, Skeleton, Stack, Text, Title } from '@mantine/core';
import { useArtworks } from '@/api/hooks';
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

export default function DiscoverPage() {
  const { artworks, hasMore, isLoading, isLoadingMore, loadMore } = useArtworks({ limit: 25 });

  const discoverArtworks = artworks.map(artwork => ({
    id: artwork.id,
    title: artwork.title,
    artist: {
      name: artwork.author.displayName || artwork.author.username,
      avatar: artwork.author.avatar || '',
    },
    image: artwork.images[0]?.url || artwork.images[0]?.thumbnailUrl || '',
    liked: false,
  }));

  return (
    <Box maw={1600} mx="auto">
      <HeroSection items={featuredItems} />

      <CategoryPills categories={categories} />

      <Flex
        direction={{ base: 'column', lg: 'row' }}
        gap="xl"
        px={{ base: 'md', md: 'xl' }}
        pb="xl"
      >
        <Box flex={1} miw={0}>
          <RankingSection tabs={rankingTabs} artworks={rankingArtworks} />

          <FeaturedArtwork artwork={featuredArtwork} />

          {isLoading
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
                    onLoadMore={hasMore ? loadMore : undefined}
                    loading={isLoadingMore}
                  />
                )}
        </Box>

        <SidebarContent
          risingStars={risingStars}
          popularTags={popularTags}
        />
      </Flex>
    </Box>
  );
}
