'use client';

import { Box, Button, Container, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFollowingFeed } from '@/api/hooks';
import { FeedArtworkCard } from '@/components/feed/FeedArtworkCard';

export default function FeedPage() {
  const locale = useLocale();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFollowingFeed(24);

  const artworks = data?.pages.flatMap(page => page.items) || [];

  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const { ref, entry } = useIntersection({
    root,
    threshold: 0.1,
  });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [entry?.isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Container ref={setRoot} size="xl" py="xl">
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
              <Stack gap="xl" maw={700} mx="auto">
                {artworks.map((artwork: any) => (
                  <FeedArtworkCard key={artwork.id} artwork={artwork} locale={locale} />
                ))}

                {/* Infinite scroll trigger element */}
                <Box ref={ref} ta="center" mt="xl" py="md">
                  {isFetchingNextPage && <Loader size="md" />}
                </Box>
              </Stack>
            )}
    </Container>
  );
}
