'use client';

import type { RelatedArtwork } from '@/mocks/artworkDetailData';
import {
  Box,
  Group,
  SimpleGrid,
  Title,
} from '@mantine/core';
import Link from 'next/link';
import { ArtworkCard } from '@/components/artwork';

type RelatedArtworksProps = {
  artworks: RelatedArtwork[];
};

export function RelatedArtworks({ artworks }: RelatedArtworksProps) {
  return (
    <Box mt="xl" pt="xl">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Related</Title>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
        {artworks.slice(0, 10).map(artwork => (
          <Link
            key={artwork.id}
            href={`/artworks/${artwork.id}`}
            style={{ textDecoration: 'none' }}
          >
            <ArtworkCard
              title={artwork.title}
              image={artwork.image}
              artist={artwork.artist}
              size="sm"
            />
          </Link>
        ))}
      </SimpleGrid>
    </Box>
  );
}
