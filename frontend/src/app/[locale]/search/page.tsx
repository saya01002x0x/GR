'use client';

import {
  Box,
  Center,
  Container,
  Grid,
  Loader,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArtworkCard } from '@/components/artwork';
import { AdvancedFilterPanel, SearchBar } from '@/components/search';

// Types matching backend response
type ArtworkHit = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  tags: string[];
  rating: string;
  isAI: boolean;
  createdAt: number;
  likeCount: number;
  viewCount: number;
};

type SearchResponse = {
  hits: ArtworkHit[];
  total: number;
  page: number;
  limit: number;
  processingTimeMs: number;
};

// API fetch function
async function searchArtworks(params: URLSearchParams): Promise<SearchResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3847';
  const response = await fetch(`${apiUrl}/search/artworks?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Search failed');
  }

  return response.json();
}

function SearchContent() {
  const searchParams = useSearchParams();

  // Fetch search results
  const { data, isLoading, error } = useQuery({
    queryKey: ['search', searchParams.toString()],
    queryFn: () => searchArtworks(searchParams),
    staleTime: 1000 * 60, // 1 minute
  });

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Search Header */}
        <Box>
          <Title order={1} mb="md">
            Search Artworks
          </Title>
          <SearchBar placeholder="Search by title, artist, tags..." />
        </Box>

        {/* Main Content */}
        <Grid gutter="xl">
          {/* Sidebar - Filters */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <AdvancedFilterPanel />
          </Grid.Col>

          {/* Results */}
          <Grid.Col span={{ base: 12, md: 9 }}>
            {/* Results Info */}
            {data && (
              <Text size="sm" c="dimmed" mb="md">
                Found
                {' '}
                {data.total}
                {' '}
                results (
                {data.processingTimeMs}
                ms)
              </Text>
            )}

            {/* Loading State */}
            {isLoading && (
              <Grid gutter="md">
                {[...Array.from({ length: 8 })].map((_, i) => (
                  <Grid.Col key={i} span={{ base: 6, sm: 4, lg: 3 }}>
                    <Skeleton height={200} radius="md" />
                  </Grid.Col>
                ))}
              </Grid>
            )}

            {/* Error State */}
            {error && (
              <Center py="xl">
                <Text c="red">Failed to load search results. Please try again.</Text>
              </Center>
            )}

            {/* Results Grid */}
            {data && data.hits.length > 0 && (
              <Grid gutter="md">
                {data.hits.map(artwork => (
                  <Grid.Col key={artwork.id} span={{ base: 6, sm: 4, lg: 3 }}>
                    <Link
                      href={`/artworks/${artwork.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <ArtworkCard
                        title={artwork.title}
                        image={artwork.thumbnail}
                        artist={artwork.author.displayName || artwork.author.username}
                        artistAvatar={artwork.author.avatar}
                        size="sm"
                      />
                    </Link>
                  </Grid.Col>
                ))}
              </Grid>
            )}

            {/* Empty State */}
            {data && data.hits.length === 0 && (
              <Center py="xl">
                <Stack align="center" gap="xs">
                  <Text size="lg" fw={500}>
                    No results found
                  </Text>
                  <Text c="dimmed" ta="center">
                    Try adjusting your search or filters
                  </Text>
                </Stack>
              </Center>
            )}
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}

// Main Page Component with Suspense for useSearchParams
export default function SearchPage() {
  return (
    <Suspense
      fallback={(
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      )}
    >
      <SearchContent />
    </Suspense>
  );
}
