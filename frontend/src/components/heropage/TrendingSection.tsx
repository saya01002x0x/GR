'use client';

import {
  Anchor,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import useSWR from 'swr';

import { ArtworkCard } from '@/components/artwork';
import { fetcher } from '@/lib/fetcher';

export function TrendingSection() {
  const { data: trendingData } = useSWR('/artworks/popular?limit=4', fetcher);
  const artworks = trendingData?.data || [];

  return (
    <Container size="xl" pt={120} pb={80}>
      <Group justify="space-between" mb="xl" align="flex-end">
        <Stack gap={4}>
          <Title order={2} fw={800} lts={-0.5} pos="relative">
            Trending Now
          </Title>
          <Text c="dimmed" fw={500}>
            Most popular artworks this week
          </Text>
        </Stack>
        <Anchor
          href="/discover"
          fw={700}
          c="primary"
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          View All
          {' '}
          <IconArrowRight size={16} />
        </Anchor>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xl" mb={80}>
        {artworks.map((artwork: any) => (
          <ArtworkCard
            key={artwork.id}
            title={artwork.title}
            image={artwork.images?.[0]?.url || ''}
            artist={artwork.author?.username || 'Unknown'}
            artistAvatar={artwork.author?.avatar}
            size="sm"
          />
        ))}
      </SimpleGrid>
    </Container>
  );
}
