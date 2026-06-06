'use client';

import type { DiscoverArtwork } from '@/mocks/discoverData';
import {
  Box,
  Loader,
  Title,
} from '@mantine/core';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ArtworkCard } from '@/components/artwork';

type DiscoverGridProps = {
  artworks: DiscoverArtwork[];
  onLoadMore?: () => void;
  loading?: boolean;
};

export function DiscoverGrid({ artworks, onLoadMore, loading }: DiscoverGridProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onLoadMore) {
      return;
    }

    const target = loadMoreRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: '600px 0px', threshold: 0 },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [loading, onLoadMore]);

  return (
    <Box>
      <Title order={3} mb="lg">
        Discover New Art
      </Title>

      <Box className="discover-grid">
        {artworks.map(artwork => (
          <Box key={artwork.id}>
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

      {onLoadMore && (
        <Box ref={loadMoreRef} ta="center" mt="xl" mih={36}>
          {loading && <Loader size="sm" />}
        </Box>
      )}
    </Box>
  );
}
