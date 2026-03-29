'use client';

import { useAuth } from '@clerk/nextjs';
import {
  ActionIcon,
  Badge,
  Card,
  Group,
  Image,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type FlaggedArtwork = {
  id: string;
  title: string;
  author: { id: string; username: string; displayName: string | null };
  images: { thumbnailUrl: string | null; url: string }[];
  _count: { reports: number };
};

export default function ModerationPage() {
  const { getToken } = useAuth();
  const [artworks, setArtworks] = useState<FlaggedArtwork[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlagged = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/admin/artworks/flagged`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setArtworks(data.artworks);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchFlagged();
  }, [fetchFlagged]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/admin/artworks/${id}/${action}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setArtworks(prev => prev.filter(a => a.id !== id));
      notifications.show({ message: `Artwork ${action}d`, color: action === 'approve' ? 'green' : 'red' });
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <Stack gap="lg">
      <Title order={2}>Content Moderation</Title>
      {artworks.length === 0
        ? (
            <Text c="dimmed">No flagged content. All clear!</Text>
          )
        : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
              {artworks.map(art => (
                <Card key={art.id} withBorder radius="md" p="sm">
                  <Card.Section>
                    <Image
                      src={art.images[0]?.thumbnailUrl || art.images[0]?.url}
                      h={200}
                      alt={art.title}
                      fallbackSrc="https://placehold.co/400x300?text=No+Image"
                    />
                  </Card.Section>
                  <Stack gap="xs" mt="sm">
                    <Text fw={600} lineClamp={1}>{art.title}</Text>
                    <Text size="xs" c="dimmed">
                      by
                      {art.author.displayName || art.author.username}
                    </Text>
                    <Group justify="space-between">
                      <Badge color="red" variant="light">
                        {art._count.reports}
                        {' '}
                        reports
                      </Badge>
                      <Group gap="xs">
                        <Tooltip label="Approve">
                          <ActionIcon color="green" variant="light" onClick={() => handleAction(art.id, 'approve')}>
                            <IconCheck size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Reject">
                          <ActionIcon color="red" variant="light" onClick={() => handleAction(art.id, 'reject')}>
                            <IconX size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}
    </Stack>
  );
}
