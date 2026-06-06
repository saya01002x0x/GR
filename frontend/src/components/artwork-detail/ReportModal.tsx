'use client';

import { useAuth } from '@clerk/nextjs';
import {
  Button,
  Group,
  Modal,
  Radio,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { apiClient } from '@/api/client';
import { E } from '@/api/endpoints';

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'NSFW', label: 'Inappropriate / NSFW content' },
  { value: 'DUPLICATE', label: 'Duplicate / copied artwork' },
  { value: 'COPYRIGHT', label: 'Copyright violation' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'OTHER', label: 'Other' },
];

type ReportModalProps = {
  artworkId: string;
  opened: boolean;
  onClose: () => void;
};

export function ReportModal({ artworkId, opened, onClose }: ReportModalProps) {
  const { getToken } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      return;
    }

    setSubmitting(true);
    try {
      apiClient.setTokenGetter(getToken);
      await apiClient.post(E.reports.create(), { reason, description, artworkId });
      notifications.show({
        title: 'Report submitted',
        message: 'Thank you for helping keep the community safe.',
        color: 'green',
      });
      onClose();
      setReason('');
      setDescription('');
    } catch {
      notifications.show({
        title: 'Failed to submit report',
        message: 'Please try again later.',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Report Artwork" centered>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Why are you reporting this artwork?
        </Text>
        <Radio.Group value={reason} onChange={setReason}>
          <Stack gap="xs">
            {REPORT_REASONS.map(r => (
              <Radio key={r.value} value={r.value} label={r.label} />
            ))}
          </Stack>
        </Radio.Group>
        <Textarea
          label="Additional details (optional)"
          placeholder="Provide more context..."
          value={description}
          onChange={e => setDescription(e.currentTarget.value)}
          rows={3}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button
            color="red"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!reason}
          >
            Submit Report
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
