'use client';

import { useAuth } from '@clerk/nextjs';
import {
  Box,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconPhoto, IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Artwork = {
  id: string;
  title: string;
  thumbnailUrl?: string;
  status: string;
  createdAt: string;
};

export default function DashboardWorksPage() {
  const { getToken, isLoaded } = useAuth();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArtworks() {
      // Wait for Clerk to be loaded
      if (!isLoaded) {
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artworks/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const response = await res.json();
          // API returns { data: [...] } format
          setArtworks(Array.isArray(response) ? response : (response.data || []));
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    fetchArtworks();
  }, [isLoaded, getToken]);

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Title order={1} fw={800}>
            My Works
          </Title>
          <Text c="dimmed">
            Manage your uploaded artworks
          </Text>
        </Box>
        <Link href="/upload">
          <Paper
            withBorder
            p="md"
            radius="md"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <IconPlus size={20} />
            <Text fw={600}>Upload New</Text>
          </Paper>
        </Link>
      </Group>

      {loading
        ? (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} h={200} radius="md" />
              ))}
            </SimpleGrid>
          )
        : artworks.length === 0
          ? (
              <Paper withBorder p="xl" radius="lg" ta="center">
                <Stack align="center" gap="md">
                  <IconPhoto size={48} color="var(--mantine-color-dimmed)" />
                  <Title order={3}>No artworks yet</Title>
                  <Text c="dimmed">
                    Start uploading your first artwork to share with the community.
                  </Text>
                  <Link href="/upload">
                    <Paper
                      withBorder
                      p="md"
                      radius="md"
                      bg="primary"
                      c="white"
                      style={{ cursor: 'pointer' }}
                    >
                      <Group gap="xs">
                        <IconPlus size={18} />
                        <Text fw={600}>Upload Artwork</Text>
                      </Group>
                    </Paper>
                  </Link>
                </Stack>
              </Paper>
            )
          : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
                {artworks.map(artwork => (
                  <Paper key={artwork.id} withBorder radius="md" p="md">
                    <Stack gap="sm">
                      {artwork.thumbnailUrl
                        ? (
                            <Box
                              h={150}
                              style={{
                                backgroundImage: `url(${artwork.thumbnailUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: 'var(--mantine-radius-md)',
                              }}
                            />
                          )
                        : (
                            <Box
                              h={150}
                              bg="gray.1"
                              style={{
                                borderRadius: 'var(--mantine-radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <IconPhoto size={32} color="var(--mantine-color-dimmed)" />
                            </Box>
                          )}
                      <Text fw={600} lineClamp={1}>
                        {artwork.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(artwork.createdAt).toLocaleDateString()}
                      </Text>
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
            )}
    </Container>
  );
}
