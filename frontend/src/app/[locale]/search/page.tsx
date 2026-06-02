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
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useSearchArtworks } from '@/api/hooks';
import { ArtworkCard } from '@/components/artwork';
import { AdvancedFilterPanel, SearchBar } from '@/components/search';

function SearchContent() {
  const searchParams = useSearchParams();

  const { data, isLoading, error } = useSearchArtworks(searchParams);

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Box>
          <Title order={1} mb="md">
            Search Artworks
          </Title>
          <SearchBar placeholder="Search by title, artist, tags..." />
        </Box>

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 3 }}>
            <AdvancedFilterPanel />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 9 }}>
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

            {isLoading && (
              <Grid gutter="md">
                {Array.from({ length: 8 }, (_, i) => i).map(idx => (
                  <Grid.Col key={`skeleton-${idx}`} span={{ base: 6, sm: 4, lg: 3 }}>
                    <Skeleton height={200} radius="md" />
                  </Grid.Col>
                ))}
              </Grid>
            )}

            {error && (
              <Center py="xl">
                <Text c="red">Failed to load search results. Please try again.</Text>
              </Center>
            )}

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
