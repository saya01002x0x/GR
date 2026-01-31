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
import { ArtworkCard } from '@/components/artwork';

const trendingArtworks = [
  {
    id: '1',
    title: 'Neon Nights 2077',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjDN9vnnxQwUH2LhCqK80yQ5BujFeYVDIUK-CQ78mJGkeNwPVUZxSuw3_ZB9bU7CamR5tB9dD87oyLBynAgqBSkEt7gdYy9_VdPq9V6e2ldOOnkDEaNcwCD8sVBkMgSGtDPqonmydd4vlPIBZL8m8-Wf9eYPSil6_4bMuQjLRPWbTxxHxYVlyswi_X797wqZZPApIcfpf3S58FgVyTTA0eqp6tjJm6lNpcbZmBT95uEOdbBkOOTPpY0hxl-j3JTapJPbhkJ902sVQ',
    artist: '@cyber_artist',
  },
  {
    id: '2',
    title: 'Floral Dreams',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKPr8VReB045_h-dw9tAWhIFosaW-4AYBMtNDaMFjmu7jHKkEosIpIVGYDj_uHxSysd8-uny8uI919BhsigHVHekVZB7ypFZdYi3VFTWOQWWcnuecOVaLMDzDqhyRrR87GNWT4kJNzTEF1B0-FAA6imFbC1F9M7VBZid4pljgp5JW0fwAE77MIH_Vi2IB0xmWp5VzpzQBEex9TuY6T6MJ9cOR_Fhmd_CiZXTJWCvbqx-h8QSaRoU0_eB3sF2kb_b8KbfIKcth7cPU',
    artist: '@nature_spirit',
  },
  {
    id: '3',
    title: 'Modern Soul',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD87S3Vi9pkMMP11M-X4TkjMkl4OU93OcEyWn8dh3RSb_SzWXiRb-bUVqYwWBKjMjk0TbgpYa3LhYLZCHsKfRk7QgcFPFYC0RObb-J7m2zj-8_rJTSpCY91MN68tiUjRGbeP_a6f01X2yLX4O6y_IwE7huHJZv1x597v-nBcdu32SHmgfmj2w8cOqNklODL_sgUADx46-VWVsKfw0kyNgXJ_9MgsU6msretuLHcGorETiCRupX4rrPcm3B6p5npkLcb4bAg7bvwAzo',
    artist: '@abstract_ly',
  },
  {
    id: '4',
    title: 'Serene Waters',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCU6avg1lXhqbjxr8BkJwhUrshbrTJkkPQESpentE7VPTnVJFIilFQYmhtNG1bZK-OKKz4zJiBVC_vuOGZyN9C5nb6QcqjrzHaQPFyb_D4VYcjvK0Bx1j4pGwuwNkj1xdpCmO2j8U63qjZgnoU5BvBpWPd4XKSiFsPYVflH7YASwXxSjCSBsMs0TDmWmp0-BmREgij7t0ihxzKwOk5jGCcWbbDR9UFkx05sThRAat4D6gQn176Fu8tg2yjGKUeArZdV3DeJIsrZN4M',
    artist: '@peak_seeker',
  },
];

export function TrendingSection() {
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
        {trendingArtworks.map(artwork => (
          <ArtworkCard
            key={artwork.id}
            title={artwork.title}
            image={artwork.image}
            artist={artwork.artist}
            size="sm"
          />
        ))}
      </SimpleGrid>
    </Container>
  );
}
