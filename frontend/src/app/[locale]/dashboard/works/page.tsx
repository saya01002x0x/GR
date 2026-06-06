'use client';

import {
  Badge,
  Box,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertTriangle, IconClock, IconPhoto, IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { useMyArtworks } from '@/api/hooks';

export default function DashboardWorksPage() {
  const { data: artworks, isLoading: loading } = useMyArtworks();
  const list = (artworks ?? []).filter(artwork => artwork.status !== 'HIDDEN');

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
        : list.length === 0
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
                {list.map(artwork => (
                  <Paper key={artwork.id} withBorder radius="md" p="md">
                    <Stack gap="sm">
                      {/* Image thumbnail or status placeholder */}
                      {artwork.status === 'PROCESSING'
                        ? (
                            <Box
                              h={150}
                              bg="gray.1"
                              style={{
                                borderRadius: 'var(--mantine-radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: 8,
                              }}
                            >
                              <Loader size="sm" />
                              <Text size="xs" c="dimmed" fw={500}>
                                Processing...
                              </Text>
                            </Box>
                          )
                        : artwork.status === 'FAILED'
                          ? (
                              <Box
                                h={150}
                                bg="red.0"
                                style={{
                                  borderRadius: 'var(--mantine-radius-md)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexDirection: 'column',
                                  gap: 8,
                                }}
                              >
                                <IconAlertTriangle size={28} color="var(--mantine-color-red-6)" />
                                <Text size="xs" c="red" fw={500}>
                                  Processing failed
                                </Text>
                              </Box>
                            )
                          : (artwork.status === 'ACTION_REQUIRED' || artwork.status === 'IN_REVIEW')
                              ? (
                                  <Link href={`/artworks/${artwork.id}/review`}>
                                    <Box
                                      h={150}
                                      bg="orange.0"
                                      style={{
                                        borderRadius: 'var(--mantine-radius-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        gap: 8,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <IconAlertTriangle size={28} color="var(--mantine-color-orange-6)" />
                                      <Text size="xs" c="orange.8" fw={500}>
                                        {artwork.status === 'ACTION_REQUIRED' ? 'Needs Review' : 'Under Review'}
                                      </Text>
                                    </Box>
                                  </Link>
                                )
                              : artwork.images?.[0]?.thumbnailUrl
                                ? (
                                    <Link href={`/artworks/${artwork.id}`}>
                                      <Box
                                        h={150}
                                        style={{
                                          backgroundImage: `url(${artwork.images[0].thumbnailUrl})`,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center',
                                          borderRadius: 'var(--mantine-radius-md)',
                                          cursor: 'pointer',
                                        }}
                                      />
                                    </Link>
                                  )
                                : (
                                    <Link href={`/artworks/${artwork.id}`}>
                                      <Box
                                        h={150}
                                        bg="gray.1"
                                        style={{
                                          borderRadius: 'var(--mantine-radius-md)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        <IconPhoto size={32} color="var(--mantine-color-dimmed)" />
                                      </Box>
                                    </Link>
                                  )}

                      {/* Title + status badge */}
                      <Group gap="xs" justify="space-between" wrap="nowrap">
                        <Text fw={600} lineClamp={1} style={{ flex: 1 }}>
                          {artwork.title}
                        </Text>
                        {artwork.status === 'PROCESSING' && (
                          <Badge
                            size="xs"
                            variant="light"
                            color="yellow"
                            leftSection={<IconClock size={10} />}
                          >
                            Processing
                          </Badge>
                        )}
                        {artwork.status === 'FAILED' && (
                          <Badge
                            size="xs"
                            variant="light"
                            color="red"
                            leftSection={<IconAlertTriangle size={10} />}
                          >
                            Failed
                          </Badge>
                        )}
                        {artwork.status === 'ACTION_REQUIRED' && (
                          <Badge
                            size="xs"
                            variant="light"
                            color="orange"
                            leftSection={<IconAlertTriangle size={10} />}
                          >
                            Action Required
                          </Badge>
                        )}
                        {artwork.status === 'IN_REVIEW' && (
                          <Badge
                            size="xs"
                            variant="light"
                            color="blue"
                            leftSection={<IconClock size={10} />}
                          >
                            In Review
                          </Badge>
                        )}
                      </Group>

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
