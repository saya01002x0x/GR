'use client';

import type { WatermarkSettings } from '@/types/watermark';
import { useAuth } from '@clerk/nextjs';
import {
  ActionIcon,
  Box,
  Button,
  Collapse,
  Container,
  Group,
  Image,
  LoadingOverlay,
  Modal,
  Paper,
  Progress,
  Radio,
  Select,
  Stack,
  Switch,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconArrowRight,
  IconCheck,
  IconCloudUpload,
  IconDropletFilled,
  IconDropletOff,
  IconRobot,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/api/client';
import { useUserProfile } from '@/api/hooks';
import { useMyTiers } from '@/api/hooks/use-payments';
import { WatermarkOptions } from '@/components/upload/WatermarkOptions';
import { DEFAULT_WATERMARK_SETTINGS } from '@/types/watermark';

type UploadForm = {
  title: string;
  description: string;
  tags: string[];
  rating: 'SAFE';
  isAI: boolean;
  visibility: 'PUBLIC' | 'TIER_GATED';
  requiredTierId: string;
};

type TagSearchResponse = {
  data?: Array<{ name: string }>;
};

export default function UploadPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>(DEFAULT_WATERMARK_SETTINGS);
  const [wmOverrides, setWmOverrides] = useState<Map<number, boolean>>(() => new Map());
  const [tagSearch, setTagSearch] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  const { data: userProfile } = useUserProfile();
  const isArtist = userProfile?.isArtist;

  const { data: tiersData } = useMyTiers();
  const tiers = tiersData?.data || [];

  const form = useForm<UploadForm>({
    initialValues: {
      title: '',
      description: '',
      tags: [],
      rating: 'SAFE',
      isAI: false,
      visibility: 'PUBLIC',
      requiredTierId: '',
    },
    validate: {
      title: value => (!value.trim() ? 'Tiêu đề là bắt buộc' : null),
      tags: value => (value.length === 0 ? 'Cần ít nhất 1 tag' : null),
      requiredTierId: (value, values) => (values.visibility === 'TIER_GATED' && !value ? 'Vui lòng chọn Tier' : null),
    },
  });

  // Create previews - cleanup on unmount to prevent memory leak
  const previews = useMemo(() => {
    return files.map(file => URL.createObjectURL(file));
  }, [files]);

  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  // Debounced tag search - fetch suggestions from API
  useEffect(() => {
    if (tagSearch.length < 2) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get<TagSearchResponse>(`/artworks/tags/search?q=${encodeURIComponent(tagSearch)}`);
        setTagSuggestions(res.data?.map(t => t.name) || []);
      } catch {
        setTagSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [tagSearch]);

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    // Append new files to existing ones (max 20 images)
    setFiles((prev) => {
      const combined = [...prev, ...acceptedFiles];
      return combined.slice(0, 20); // Limit to 20 images
    });
  }, []);

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setWmOverrides((prev) => {
      const next = new Map<number, boolean>();
      prev.forEach((val, key) => {
        if (key < index) {
          next.set(key, val);
        } else if (key > index) {
          next.set(key - 1, val);
        }
      });
      return next;
    });
  };

  const toggleWmOverride = (index: number) => {
    setWmOverrides((prev) => {
      const next = new Map(prev);
      const current = next.get(index);
      if (current === undefined) {
        next.set(index, false);
      } else {
        next.delete(index);
      }
      return next;
    });
  };

  const handleSubmit = async (values: UploadForm) => {
    if (files.length === 0) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng chọn ít nhất 1 ảnh',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      apiClient.setTokenGetter(getToken);

      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('tags', JSON.stringify(values.tags.map(t => t.trim().toLowerCase())));
      formData.append('rating', 'SAFE');
      formData.append('isAI', String(values.isAI));
      formData.append('visibility', values.visibility);
      if (values.visibility === 'TIER_GATED' && values.requiredTierId) {
        formData.append('requiredTierId', values.requiredTierId);
      }

      files.forEach(file => formData.append('images', file));

      const metadata = files.map((_, index) => ({
        order: index,
        caption: '',
        watermark: watermarkSettings.enabled
          ? {
              enabled: wmOverrides.get(index) !== false,
              position: watermarkSettings.position,
              opacity: watermarkSettings.opacity,
              size: watermarkSettings.size,
            }
          : { enabled: false },
      }));
      formData.append('metadata', JSON.stringify(metadata));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artworks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        // Start listening to SSE
        setIsProcessing(true);
        setProgressMessage('Đang tải dữ liệu lên hệ thống...');
        setProgressPercent(0);

        const evtSource = new EventSource(
          `${process.env.NEXT_PUBLIC_API_URL}/artworks/job/${data.data.jobId}/progress`,
        );

        evtSource.onmessage = (event) => {
          const payload = JSON.parse(event.data);
          setProgressPercent(payload.percent || 0);
          setProgressMessage(payload.message || 'Đang xử lý...');

          if (payload.state === 'completed') {
            evtSource.close();
            setIsProcessing(false);
            if (payload.hasFailures) {
              notifications.show({
                title: 'Hoàn tất có lỗi',
                message: `Đã xử lý xong, nhưng có một số ảnh bị lỗi. Vui lòng kiểm tra lại.`,
                color: 'orange',
                icon: <IconAlertCircle size={16} />,
              });
              router.push('/dashboard/works'); // Redirect to review page later
            } else {
              notifications.show({
                title: 'Thành công! 🎉',
                message: 'Artwork của bạn đã được xuất bản hoàn toàn',
                color: 'green',
                icon: <IconCheck size={16} />,
              });
              router.push('/dashboard/works');
            }
          } else if (payload.state === 'failed') {
            evtSource.close();
            setIsProcessing(false);
            setLoading(false);
            notifications.show({
              title: 'Lỗi xử lý',
              message: payload.message || 'Tiến trình xử lý ảnh thất bại',
              color: 'red',
              icon: <IconAlertCircle size={16} />,
            });
          }
        };

        evtSource.onerror = () => {
          evtSource.close();
          // Fallback if SSE disconnects
          setIsProcessing(false);
          router.push('/dashboard/works');
        };

        // Don't setLoading(false) here, let the SSE handle the final state
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      setLoading(false);
      notifications.show({
        title: 'Lỗi upload',
        message: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  // Show message if not artist
  if (isArtist === false) {
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" radius="lg" withBorder ta="center">
          <IconShieldCheck size={48} color="var(--mantine-color-primary-6)" />
          <Title order={2} mt="md">
            Only Artist can upload artwork
          </Title>
          <Text c="dimmed" mt="sm">
            Please become an Artist to upload artwork.
          </Text>
          <Button mt="lg" onClick={() => router.push('/dashboard/general')}>
            To Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl" pos="relative">
      <LoadingOverlay visible={loading && !isProcessing} overlayProps={{ blur: 2 }} />

      <Modal
        opened={isProcessing}
        onClose={() => {}}
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        title={(
          <Title order={3} fw={700}>
            Đang xử lý Artwork...
          </Title>
        )}
      >
        <Stack gap="md" py="md">
          <Text size="sm" c="dimmed">
            {progressMessage}
          </Text>
          <Progress value={progressPercent} size="xl" radius="xl" striped animated />
          <Text size="xs" ta="center" c="dimmed">
            Vui lòng không đóng trang này cho đến khi hoàn tất.
          </Text>
        </Stack>
      </Modal>

      <Box mb="xl">
        <Title order={1} fw={800}>
          Submit New Artwork
        </Title>
        <Text c="dimmed" size="lg">
          Share your latest creation with the community.
        </Text>
      </Box>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Upload Drop Zone */}
          <Paper p="xl" radius="lg" withBorder>
            <Stack gap="md">
              {/* Existing image previews */}
              {previews.length > 0 && (
                <>
                  <Group justify="space-between" align="center">
                    <Text fw={600} size="sm">
                      {files.length}
                      {' '}
                      image
                      {files.length !== 1 ? 's' : ''}
                      {' '}
                      selected
                      {files.length < 20 && ` (max 20)`}
                    </Text>
                    {files.length > 1 && (
                      <Button variant="subtle" size="xs" color="red" onClick={() => setFiles([])} disabled={loading}>
                        Clear all
                      </Button>
                    )}
                  </Group>

                  {previews.map((url, index) => (
                    <Box key={url} pos="relative">
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        radius="md"
                        fit="contain"
                        mah={300}
                      />
                      <Group pos="absolute" top={8} right={8} gap={4}>
                        <Box
                          px="xs"
                          py={2}
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: 'var(--mantine-radius-sm)',
                          }}
                        >
                          <Text size="xs" c="white" fw={500}>
                            {index + 1}
                            {' '}
                            /
                            {files.length}
                          </Text>
                        </Box>
                        {watermarkSettings.enabled && (
                          <ActionIcon
                            variant="filled"
                            color={wmOverrides.get(index) === false ? 'gray' : 'primary'}
                            size="sm"
                            onClick={() => toggleWmOverride(index)}
                            disabled={loading}
                            title={wmOverrides.get(index) === false ? 'Watermark off for this image' : 'Watermark on for this image'}
                          >
                            {wmOverrides.get(index) === false
                              ? <IconDropletOff size={14} />
                              : <IconDropletFilled size={14} />}
                          </ActionIcon>
                        )}
                        <ActionIcon
                          variant="filled"
                          color="red"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          disabled={loading}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      </Group>
                    </Box>
                  ))}
                </>
              )}

              {/* Dropzone for adding more images - always visible if under limit */}
              {files.length < 20 && (
                <Dropzone
                  onDrop={handleDrop}
                  accept={IMAGE_MIME_TYPE}
                  maxSize={20 * 1024 * 1024}
                  multiple
                  disabled={loading}
                >
                  <Group justify="center" gap="xl" py={previews.length > 0 ? 'sm' : 'xl'} style={{ pointerEvents: 'none' }}>
                    <Dropzone.Accept>
                      <IconCloudUpload size={previews.length > 0 ? 32 : 52} color="var(--mantine-color-primary-6)" />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX size={previews.length > 0 ? 32 : 52} color="var(--mantine-color-red-6)" />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconCloudUpload size={previews.length > 0 ? 32 : 52} color="var(--mantine-color-dimmed)" />
                    </Dropzone.Idle>

                    <Stack gap={4} align="center">
                      <Text size={previews.length > 0 ? 'sm' : 'lg'} fw={700}>
                        {previews.length > 0 ? 'Add more images' : 'Drag and drop your art here'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Supports JPG, PNG, GIF, WebP up to 20MB each
                      </Text>
                    </Stack>
                  </Group>
                </Dropzone>
              )}
            </Stack>

            <Text size="xs" c="dimmed" mt="md" p="sm" bg="gray.1" style={{ borderRadius: 8 }}>
              ℹ️ Please ensure you own the rights to the artwork you upload. Do not post work created by others without permission. AI-generated content must be labeled.
            </Text>
          </Paper>

          {/* Form Fields */}
          <Paper p="xl" radius="lg" withBorder>
            <Stack gap="md">
              <TextInput
                label="Title"
                placeholder="Give your work a name"
                required
                disabled={loading}
                {...form.getInputProps('title')}
              />

              <Textarea
                label="Description"
                placeholder="Tell the story behind your art..."
                minRows={4}
                disabled={loading}
                {...form.getInputProps('description')}
              />

              <TagsInput
                label="Tags"
                placeholder="Add tags (press Enter)"
                description="Minimum 1 tag required. Type to search existing tags."
                maxTags={20}
                data={tagSearch.length >= 2 ? tagSuggestions : []}
                searchValue={tagSearch}
                onSearchChange={setTagSearch}
                {...form.getInputProps('tags')}
                disabled={loading}
              />
            </Stack>
          </Paper>

          {/* Watermark Options */}
          <Paper p="xl" radius="lg" withBorder>
            <Title order={4} mb="md">
              Watermark Options
            </Title>
            <WatermarkOptions
              value={watermarkSettings}
              onChange={setWatermarkSettings}
              disabled={loading}
            />
          </Paper>

          {/* AI Label */}
          <Paper p="xl" radius="lg" withBorder>
            <Title order={4} mb="md">
              Content Options
            </Title>

            <Switch
              label="AI Generated"
              description="Created with AI tools"
              disabled={loading}
              {...form.getInputProps('isAI', { type: 'checkbox' })}
              thumbIcon={<IconRobot size={12} />}
            />
          </Paper>

          {/* Visibility Options */}
          <Paper p="xl" radius="lg" withBorder>
            <Title order={4} mb="md">
              Visibility & Access
            </Title>

            <Radio.Group
              {...form.getInputProps('visibility')}
            >
              <Stack gap="sm">
                <Radio value="PUBLIC" label="Public - Anyone can view" disabled={loading} />
                <Radio value="TIER_GATED" label="Tier Gated - Only subscribers can view" disabled={loading} />
              </Stack>
            </Radio.Group>

            <Collapse in={form.values.visibility === 'TIER_GATED'}>
              <Box mt="md" p="md" bg="var(--mantine-color-gray-0)" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                {tiers.length === 0
                  ? (
                      <Text size="sm" c="dimmed">
                        You haven't created any tiers yet.
                        {' '}
                        <Link href="/dashboard/commissions" style={{ color: 'var(--mantine-color-primary-6)' }}>Create a tier</Link>
                        {' '}
                        first.
                      </Text>
                    )
                  : (
                      <Select
                        label="Select Required Tier"
                        placeholder="Choose a tier..."
                        data={tiers.map((tier: any) => ({ value: tier.id, label: tier.name }))}
                        disabled={loading}
                        {...form.getInputProps('requiredTierId')}
                        required={form.values.visibility === 'TIER_GATED'}
                      />
                    )}
              </Box>
            </Collapse>
          </Paper>

          {/* Action Buttons */}
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              rightSection={<IconArrowRight size={18} />}
              loading={loading}
            >
              Publish Work
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
}
