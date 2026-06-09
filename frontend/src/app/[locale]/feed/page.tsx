'use client';

import { Box, Button, Container, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useFollowingFeed } from '@/api/hooks';
import { ArtworkCard } from '@/components/artwork';

export default function FeedPage() {
  const locale = useLocale();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFollowingFeed(24);

  const artworks = data?.pages.flatMap(page => page.items) || [];

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Your Feed</Title>
        <Button component={Link} href={`/${locale}/discover`} variant="light">
          Discover Artists
        </Button>
      </Group>

      {isLoading
        ? (
            <Box ta="center" py={100}>
              <Loader size="xl" />
            </Box>
          )
        : artworks.length === 0
          ? (
              <Box ta="center" py={100}>
                <Text size="lg" c="dimmed" mb="md">
                  Your feed is empty. Follow some artists to see their artworks here!
                </Text>
                <Button component={Link} href={`/${locale}/discover`}>
                  Explore Artists
                </Button>
              </Box>
            )
          : (
              <Stack gap="xl">
                <Box className="discover-grid">
                  {artworks.map((artwork: any) => (
                    <Box key={artwork.id}>
                      <Link href={`/${locale}/artworks/${artwork.id}`} style={{ textDecoration: 'none' }}>
                        <ArtworkCard
                          title={artwork.title}
                          image={artwork.images?.[0]?.url || artwork.images?.[0]?.thumbnailUrl || ''}
                          artist={artwork.author?.displayName || artwork.author?.username || 'Unknown'}
                          artistAvatar={artwork.author?.avatar}
                          liked={false}
                          size="sm"
                          onLikeToggle={() => {}}
                        />
                      </Link>
                    </Box>
                  ))}
                </Box>

                {hasNextPage && (
                  <Box ta="center" mt="xl">
                    <Button
                      variant="subtle"
                      size="md"
                      onClick={() => fetchNextPage()}
                      loading={isFetchingNextPage}
                    >
                      Load More
                    </Button>
                  </Box>
                )}
              </Stack>
            )}
    </Container>
  );
}
