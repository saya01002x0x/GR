'use client';

import { useUser } from '@clerk/nextjs';
import {
  Box,
  Center,
  Container,
  Grid,
  Group,
  Loader,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconSearch, IconSparkles } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';
import { useSearchArtworks } from '@/api/hooks';
import { useAiSearchText } from '@/api/hooks/use-search';
import { ArtworkCard } from '@/components/artwork';
import {
  AdvancedFilterPanel,
  SearchBar,
  SketchSearchModal,
  SketchSearchTrigger,
} from '@/components/search';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();
  const query = searchParams.get('q') || '';
  const searchMode = searchParams.get('mode') === 'ai' && isSignedIn !== false ? 'ai' : 'standard';

  // State for Sketch Search
  const [isSketchModalOpen, setIsSketchModalOpen] = useState(false);

  // Hooks
  const { data: standardData, isLoading: isLoadingStandard, error: errorStandard } = useSearchArtworks(searchParams);
  const { data: aiData, isLoading: isLoadingAi, error: errorAi } = useAiSearchText(query, 20, searchMode === 'ai');

  const handleSearchModeChange = useCallback((mode: 'standard' | 'ai') => {
    const params = new URLSearchParams(searchParams.toString());

    if (mode === 'ai') {
      params.set('mode', 'ai');
    } else {
      params.set('mode', 'standard');
    }

    const newUrl = params.toString() ? `/search?${params}` : '/search';
    router.push(newUrl, { scroll: false });
  }, [router, searchParams]);

  // Determine which data to show
  let currentData = null;
  let currentLoading = false;
  let currentError = null;

  if (searchMode === 'ai' && query) {
    currentData = aiData;
    currentLoading = isLoadingAi;
    currentError = errorAi;
  } else {
    currentData = standardData;
    currentLoading = isLoadingStandard;
    currentError = errorStandard;
  }

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
            <SketchSearchTrigger onClick={() => setIsSketchModalOpen(true)} />
            <AdvancedFilterPanel />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 9 }}>
            {/* Mode Toggle for Text Search */}
            <Group mb="lg" align="center">
              <Text size="sm" fw={500} c="dimmed">
                Search Mode:
              </Text>
              <SegmentedControl
                value={searchMode}
                onChange={val => handleSearchModeChange(val as 'standard' | 'ai')}
                data={[
                  {
                    value: 'standard',
                    label: (
                      <Group gap="xs" wrap="nowrap">
                        <IconSearch size={16} />
                        <Text size="sm">Standard</Text>
                      </Group>
                    ),
                  },
                  {
                    value: 'ai',
                    disabled: isSignedIn === false,
                    label: (
                      <Group gap="xs" wrap="nowrap">
                        <IconSparkles size={16} />
                        <Text size="sm">AI Semantic</Text>
                      </Group>
                    ),
                  },
                ]}
              />
            </Group>

            {currentData && (
              <Text size="sm" c="dimmed" mb="md">
                Found
                {' '}
                {currentData.total}
                {' '}
                results (
                {currentData.processingTimeMs || 0}
                ms)
              </Text>
            )}

            {currentLoading && (
              <Grid gutter="md">
                {Array.from({ length: 8 }, (_, i) => i).map(idx => (
                  <Grid.Col key={`skeleton-${idx}`} span={{ base: 6, sm: 4, lg: 3 }}>
                    <Skeleton height={200} radius="md" />
                  </Grid.Col>
                ))}
              </Grid>
            )}

            {currentError && (
              <Center py="xl">
                <Text c="red">Failed to load search results. Please try again.</Text>
              </Center>
            )}

            {currentData && currentData.hits?.length > 0 && (
              <Grid gutter="md">
                {currentData.hits.map((artwork: any) => (
                  <Grid.Col key={artwork.id} span={{ base: 6, sm: 4, lg: 3 }}>
                    <Link href={`/artworks/${artwork.id}`} style={{ textDecoration: 'none' }}>
                      <ArtworkCard
                        title={artwork.title}
                        image={artwork.thumbnail}
                        artist={artwork.author?.displayName || artwork.author?.username || 'Unknown'}
                        artistAvatar={artwork.author?.avatar}
                        size="sm"
                      />
                    </Link>
                  </Grid.Col>
                ))}
              </Grid>
            )}

            {currentData && currentData.hits?.length === 0 && (
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

      <SketchSearchModal
        opened={isSketchModalOpen}
        onClose={() => setIsSketchModalOpen(false)}
      />
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
