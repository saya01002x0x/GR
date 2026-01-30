'use client';

import type { Artist } from '@/mocks/artistData';
import {
  Box,
  Button,
  Group,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { useState } from 'react';
import { ArtworkCard } from './ArtworkCard';

type ArtworkGalleryProps = {
  artist: Artist;
};

export function ArtworkGallery({ artist }: ArtworkGalleryProps) {
  const [activeTab, setActiveTab] = useState<string | null>('illustrations');

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
            {artist.categories.map(category => (
              <Tabs.Tab
                key={category.name.toLowerCase().replace(' ', '-')}
                value={category.name.toLowerCase().replace(' ', '-')}
                px="md"
                py="sm"
                fw={activeTab === category.name.toLowerCase().replace(' ', '-') ? 700 : 500}
                c={activeTab === category.name.toLowerCase().replace(' ', '-') ? 'primary' : 'dimmed'}
                style={{
                  borderBottom: activeTab === category.name.toLowerCase().replace(' ', '-')
                    ? '2px solid var(--mantine-color-primary-6)'
                    : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                {category.name}
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
      <Box className="masonry-grid">
        {artist.artworks.map(artwork => (
          <ArtworkCard key={artwork.id} artwork={artwork} />
        ))}
      </Box>

      {/* Load More Button */}
      <Group justify="center" mt="xl">
        <Button
          variant="default"
          radius="xl"
          size="md"
        >
          Load more artworks
        </Button>
      </Group>
    </Stack>
  );
}
