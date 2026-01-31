'use client';

import type { DiscoverArtwork } from '@/mocks/discoverData';
import {
  Box,
  Button,
  Title,
} from '@mantine/core';
import Link from 'next/link';
import { ArtworkCard } from '@/components/artwork';

type DiscoverGridProps = {
  artworks: DiscoverArtwork[];
  onLoadMore?: () => void;
  loading?: boolean;
};

export function DiscoverGrid({ artworks, onLoadMore, loading }: DiscoverGridProps) {
  return (
    <Box>
      <Title order={3} mb="lg">
        Discover New Art
      </Title>

      {/* Masonry Grid - uses CSS from global.css */}
      <Box className="masonry-grid">
        {artworks.map(artwork => (
          <Box key={artwork.id} className="masonry-item">
            <Link href={`/artworks/${artwork.id}`} style={{ textDecoration: 'none' }}>
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
            </Link>
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
            loading={loading}
            leftSection={loading ? undefined : undefined}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
