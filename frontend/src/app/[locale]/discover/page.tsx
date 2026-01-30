'use client';

import { Box, Flex } from '@mantine/core';
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
  discoverArtworks,
  featuredArtwork,
  featuredItems,
  popularTags,
  rankingArtworks,
  rankingTabs,
  risingStars,
} from '@/mocks/discoverData';

export default function DiscoverPage() {
  const handleLoadMore = () => {
    // TODO: Implement infinite scroll
  };

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

          {/* Discover Grid */}
          <DiscoverGrid
            artworks={discoverArtworks}
            onLoadMore={handleLoadMore}
          />
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
