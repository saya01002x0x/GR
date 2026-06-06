'use client';

import type { ArtworkListItem } from '@/types/artwork';
import { Box, Flex, Skeleton, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';
import {
  useArtworks,
  useDiscoverHero,
  useFeaturedArtworks,
  usePopularTags,
  useRanking,
  useRisingStars,
} from '@/api/hooks';
import {
  CategoryPills,
  DiscoverGrid,
  FeaturedArtwork,
  HeroSection,
  RankingSection,
  SidebarContent,
} from '@/components/discover';
import { categories, rankingTabs } from '@/mocks/discoverData';

export default function DiscoverPage() {
  const { artworks, hasMore, isLoading, isLoadingMore, loadMore } = useArtworks({ limit: 25 });
  const { data: heroItems, isLoading: isHeroLoading } = useDiscoverHero();
  const { data: featured, isLoading: isFeaturedLoading } = useFeaturedArtworks();

  const [activeRankingTab, setActiveRankingTab] = useState<'daily' | 'weekly' | 'monthly' | 'rookie'>('daily');
  const { data: rankingData, isLoading: isRankingLoading } = useRanking(activeRankingTab);

  const { data: risingStarsData } = useRisingStars();
  const { data: popularTagsData } = usePopularTags();

  const heroItemsFormatted = (heroItems || []).map(item => ({
    ...item,
    tag: item.tag ?? { label: 'Featured', color: 'primary' },
  }));

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

  const rankingArtworksFormatted = (rankingData || []).map((artwork: ArtworkListItem, index: number) => ({
    id: artwork.id,
    title: artwork.title,
    artist: {
      name: artwork.author.displayName || artwork.author.username,
      avatar: artwork.author.avatar || '',
    },
    image: artwork.images[0]?.url || artwork.images[0]?.thumbnailUrl || '',
    rank: index + 1,
  }));

  return (
    <Box maw={1600} mx="auto">
      {isHeroLoading
        ? <Skeleton height={400} mb="xl" />
        : (
            <HeroSection items={heroItemsFormatted} />
          )}

      <CategoryPills categories={categories} />

      <Flex
        direction={{ base: 'column', lg: 'row' }}
        gap="xl"
        px={{ base: 'md', md: 'xl' }}
        pb="xl"
      >
        <Box flex={1} miw={0}>
          {isRankingLoading
            ? <Skeleton height={300} mb="xl" />
            : (
                <RankingSection
                  tabs={rankingTabs}
                  artworks={rankingArtworksFormatted}
                  activeTab={activeRankingTab}
                  onTabChange={tab => setActiveRankingTab(tab as any)}
                />
              )}

          {isFeaturedLoading
            ? <Skeleton height={400} mb="xl" />
            : (
                <FeaturedArtwork artworks={featured || []} />
              )}

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
          risingStars={risingStarsData || []}
          popularTags={popularTagsData || []}
        />
      </Flex>
    </Box>
  );
}
