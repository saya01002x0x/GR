'use client';

import type { DiscoverArtwork } from '@/mocks/discoverData';
import {
  Box,
  Button,
  Title,
} from '@mantine/core';
import { ArtworkCard } from '@/components/artwork';

type DiscoverGridProps = {
  artworks: DiscoverArtwork[];
  onLoadMore?: () => void;
};

export function DiscoverGrid({ artworks, onLoadMore }: DiscoverGridProps) {
  return (
    <Box>
      <Title order={3} mb="lg">
        Discover New Art
      </Title>

      {/* Masonry Grid - uses CSS from global.css */}
      <Box className="masonry-grid">
        {artworks.map(artwork => (
          <Box key={artwork.id} className="masonry-item">
            <ArtworkCard
              title={artwork.title}
              image={artwork.image}
              artist={artwork.artist.name}
              artistAvatar={artwork.artist.avatar}
              liked={artwork.liked}
              size="sm"
              onLikeToggle={() => {
                // TODO: Implement like toggle
              }}
            />
          </Box>
        ))}
      </Box>

      {/* Load More */}
      {onLoadMore && (
        <Box ta="center" mt="xl">
          <Button
            variant="default"
            radius="xl"
            size="md"
            onClick={onLoadMore}
          >
            Load More
          </Button>
        </Box>
      )}
    </Box>
  );
}
