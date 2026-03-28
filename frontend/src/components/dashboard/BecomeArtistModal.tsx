'use client';

import { useAuth } from '@clerk/nextjs';
import {
  Button,
  Checkbox,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBrush, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';

type BecomeArtistModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function BecomeArtistModal({
  opened,
  onClose,
  onSuccess,
}: BecomeArtistModalProps) {
  const { getToken } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBecomeArtist = async () => {
    if (!agreed) {
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/become-artist`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ agreedToTerms: true }),
        },
      );

      const data = await res.json();

      if (data.success) {
        notifications.show({
          title: 'Congratulation 🎉',
          message: 'You have become an Artist. Now you can upload artwork!',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        onSuccess();
        onClose();
      } else {
        notifications.show({
          title: 'Error',
          message: data.message || 'Failed to upgrade account',
          color: 'red',
        });
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={(
        <Title order={3} component="div" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconBrush size={24} color="var(--mantine-color-primary-6)" />
          Become an Artist
        </Title>
      )}
      size="md"
    >
      <Stack gap="md">
        <Text c="dimmed">
          By becoming an Artist, you can:
        </Text>

        <Stack gap="xs" pl="md">
          <Text size="sm">✅ Upload and share your artwork</Text>
          <Text size="sm">✅ Receive likes and comments from the community</Text>
          <Text size="sm">✅ Build your personal portfolio</Text>
          <Text size="sm">✅ Connect with other artists</Text>
        </Stack>

        <Text size="sm" c="dimmed" mt="sm">
          <strong>Artist Terms:</strong>
          {' '}
          You commit to only upload content you own the copyright or have the right to share. AI-generated content must be clearly marked. Violation may result in account suspension.
        </Text>

        <Checkbox
          checked={agreed}
          onChange={e => setAgreed(e.currentTarget.checked)}
          label="I have read and agree to the terms above"
          mt="md"
        />

        <Button
          fullWidth
          disabled={!agreed}
          loading={loading}
          onClick={handleBecomeArtist}
          leftSection={<IconBrush size={18} />}
        >
          Become an Artist
        </Button>
      </Stack>
    </Modal>
  );
}
