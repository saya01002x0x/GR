'use client';

import type { PublicArtistDetail } from './ProfileSidebar';
import {
  Box,
  Button,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { useState } from 'react';
import { useArtistArtworks } from '@/api/hooks/use-artist-artworks';
import { ArtworkCard } from './ArtworkCard';

type ArtworkGalleryProps = {
  artist: PublicArtistDetail;
};

export function ArtworkGallery({ artist }: ArtworkGalleryProps) {
  const [activeTab, setActiveTab] = useState<string | null>('all');

  const { artworks, hasMore, isLoading, isLoadingMore, loadMore } = useArtistArtworks(
    artist.username,
    activeTab === 'all' ? undefined : activeTab || undefined,
  );

  const tabs = [
    { value: 'all', label: 'All Artworks', count: artist.artworkCounts.all },
    { value: 'free', label: 'Free', count: artist.artworkCounts.free },
    ...artist.tiers.map((t: any) => ({
      value: t.id,
      label: t.name,
      count: artist.artworkCounts.tiers[t.id] || 0,
    })),
  ].filter(t => t.count > 0 || t.value === 'all'); // keep 'all' even if 0

  return (
    <Stack gap="lg" flex={1} maw="100%" pt={{ base: 'xs', lg: 'xl' }}>
      {/* Navigation Tabs */}
      <Box
        pos="sticky"
        top={64}
        bg="var(--mantine-color-body)"
        style={{
          zIndex: 30,
          backdropFilter: 'blur(8px)',
        }}
        pt="xs"
        pb="sm"
      >
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          variant="unstyled"
        >
          <Tabs.List
            style={{
              borderBottom: '1px solid var(--mantine-color-gray-2)',
              gap: 0,
              flexWrap: 'nowrap',
              overflowX: 'auto',
            }}
          >
            {tabs.map(category => (
              <Tabs.Tab
                key={category.value}
                value={category.value}
                px="md"
                py="sm"
                fw={activeTab === category.value ? 700 : 500}
                c={activeTab === category.value ? 'primary' : 'dimmed'}
                style={{
                  borderBottom: activeTab === category.value
                    ? '2px solid var(--mantine-color-primary-6)'
                    : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                {category.label}
                {category.count > 0 && (
                  <Text component="span" size="xs" c="dimmed" ml={4} fw={400}>
                    {category.count}
                  </Text>
                )}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
      </Box>

      {/* Masonry Gallery */}
      {isLoading
        ? (
            <Group justify="center" p="xl">
              <Loader />
            </Group>
          )
        : artworks.length === 0
          ? (
              <Group justify="center" p="xl">
                <Text c="dimmed">No artworks found in this category.</Text>
              </Group>
            )
          : (
              <Box className="masonry-grid">
                {artworks.map(artwork => (
                  <ArtworkCard key={artwork.id} artwork={artwork} />
                ))}
              </Box>
            )}

      {/* Load More Button */}
      {hasMore && (
        <Group justify="center" mt="xl">
          <Button
            variant="default"
            radius="xl"
            size="md"
            onClick={loadMore}
            loading={isLoadingMore}
          >
            Load more artworks
          </Button>
        </Group>
      )}
    </Stack>
  );
}
