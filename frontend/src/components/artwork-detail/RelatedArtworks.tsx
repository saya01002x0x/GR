'use client';

import type { RelatedArtwork } from '@/mocks/artworkDetailData';
import {
  Anchor,
  Box,
  Group,
  SimpleGrid,
  Title,
} from '@mantine/core';
import { ArtworkCard } from '@/components/artwork';

type RelatedArtworksProps = {
  artworks: RelatedArtwork[];
};

export function RelatedArtworks({ artworks }: RelatedArtworksProps) {
  return (
    <Box mt="xl" pt="xl">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Related</Title>
        <Anchor href="#" size="sm" fw={700} c="primary">
          See more
        </Anchor>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing="sm">
        {artworks.map(artwork => (
          <ArtworkCard
            key={artwork.id}
            title={artwork.title}
            image={artwork.image}
            artist={artwork.artist}
            size="sm"
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}
