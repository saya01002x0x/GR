'use client';

import {
  Alert,
  Button,
  Card,
  Center,
  Container,
  Image,
  Loader,
  Modal,
  SimpleGrid,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/api/client';
import { E } from '@/api/endpoints';
import { useArtwork } from '@/api/hooks';

export default function ReviewArtworkPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const locale = params.locale as string | undefined;

  const { artwork, isLoading, error } = useArtwork(id);
  const [opened, { open, close }] = useDisclosure(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentStatus = submitted ? 'IN_REVIEW' : artwork?.status;
  const canAppeal = currentStatus === 'ACTION_REQUIRED';
  const isInReview = currentStatus === 'IN_REVIEW';
  const dashboardWorksPath = useMemo(
    () => (locale ? `/${locale}/dashboard/works` : '/dashboard/works'),
    [locale],
  );

  useEffect(() => {
    if (!isLoading && artwork && currentStatus) {
      if (currentStatus !== 'ACTION_REQUIRED' && currentStatus !== 'IN_REVIEW') {
        router.push(dashboardWorksPath);
      }
    }
  }, [isLoading, artwork, currentStatus, dashboardWorksPath, router]);

  const handleSubmitTicket = async () => {
    if (!canAppeal) {
      notifications.show({
        title: 'Already in review',
        message: 'This appeal has already been sent and is waiting for moderator review.',
        color: 'blue',
      });
      close();
      return;
    }

    if (!reason.trim()) {
      notifications.show({
        title: 'Missing reason',
        message: 'Please enter a reason before sending the appeal.',
        color: 'red',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.post(E.reports.create(), {
        reason: 'OTHER',
        artworkId: id,
        description: `[APPEAL] ${reason.trim()}`,
      });

      setSubmitted(true);
      setReason('');
      notifications.show({
        title: 'Appeal sent',
        message: 'Your appeal ticket was sent successfully.',
        color: 'green',
      });

      close();
    } catch (err: any) {
      notifications.show({
        title: 'Appeal failed',
        message: err.message || 'Something went wrong while sending the ticket.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error || !artwork) {
    return (
      <Center h={400}>
        <Text c="red">Failed to load artwork</Text>
      </Center>
    );
  }

  if (currentStatus !== 'ACTION_REQUIRED' && currentStatus !== 'IN_REVIEW') {
    return null;
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl">Artwork Review</Title>

      {isInReview && (
        <Alert color="blue" mb="xl" title="Appeal under review">
          <Text size="sm">
            Your appeal has been sent. Moderators will review this artwork before it can be published.
          </Text>
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {artwork.images.map((img) => {
          const isFailed = img.status === 'FAILED';
          const errorReason = img.errorMetadata?.reason || 'Unknown issue';

          return (
            <Card
              key={img.id}
              shadow="sm"
              padding="md"
              radius="md"
              withBorder
              style={{
                borderColor: isFailed ? 'var(--mantine-color-red-6)' : undefined,
                borderWidth: isFailed ? 2 : 1,
              }}
            >
              <Card.Section>
                <Image
                  src={img.url}
                  height={200}
                  alt="Artwork image"
                  fallbackSrc="https://placehold.co/600x400?text=Image+not+found"
                />
              </Card.Section>

              {isFailed && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Issue detected"
                  color="red"
                  mt="md"
                  p="xs"
                >
                  <Text size="sm">{errorReason}</Text>
                </Alert>
              )}
            </Card>
          );
        })}
      </SimpleGrid>

      <Center mt="xl">
        {canAppeal
          ? (
              <Button size="md" color="red" onClick={open}>
                Send Appeal Ticket
              </Button>
            )
          : (
              <Button size="md" variant="light" disabled>
                Appeal Sent
              </Button>
            )}
      </Center>

      <Modal opened={opened} onClose={close} title="Send Appeal Ticket" centered>
        <Textarea
          label="Reason"
          placeholder="Explain why this artwork should be reviewed again..."
          value={reason}
          onChange={event => setReason(event.currentTarget.value)}
          minRows={4}
          data-autofocus
        />
        <Button
          fullWidth
          mt="md"
          onClick={handleSubmitTicket}
          loading={isSubmitting}
          disabled={!canAppeal}
        >
          Send Ticket
        </Button>
      </Modal>
    </Container>
  );
}
