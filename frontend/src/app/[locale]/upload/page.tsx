'use client';

import {
  ActionIcon,
  Box,
  Button,
  Container,
  Group,
  Image,
  LoadingOverlay,
  Paper,
  Radio,
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
  IconRobot,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

type UploadForm = {
  title: string;
  description: string;
  tags: string[];
  rating: 'SAFE' | 'R18' | 'R18G';
  isAI: boolean;
};

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [isArtist, setIsArtist] = useState<boolean | null>(null);

  const form = useForm<UploadForm>({
    initialValues: {
      title: '',
      description: '',
      tags: [],
      rating: 'SAFE',
      isAI: false,
    },
    validate: {
      title: value => (!value.trim() ? 'Tiêu đề là bắt buộc' : null),
      tags: value => (value.length === 0 ? 'Cần ít nhất 1 tag' : null),
    },
  });

  // Check if user is artist
  useEffect(() => {
    async function checkArtist() {
      try {
        const token = await window.Clerk?.session?.getToken();
        if (!token) {
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setIsArtist(data.isArtist);
        }
      } catch {
        // Ignore
      }
    }
    checkArtist();
  }, []);

  // Create previews - cleanup on unmount to prevent memory leak
  const previews = useMemo(() => {
    return files.map(file => URL.createObjectURL(file));
  }, [files]);

  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    // Append new files to existing ones (max 20 images)
    setFiles((prev) => {
      const combined = [...prev, ...acceptedFiles];
      return combined.slice(0, 20); // Limit to 20 images
    });
  }, []);

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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
      const token = await window.Clerk?.session?.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('tags', JSON.stringify(values.tags.map(t => t.trim().toLowerCase())));
      formData.append('rating', values.rating);
      formData.append('isAI', String(values.isAI));

      // Append images in order
      files.forEach(file => formData.append('images', file));

      // Add metadata with order for each image
      const metadata = files.map((_, index) => ({
        order: index,
        caption: '',
      }));
      formData.append('metadata', JSON.stringify(metadata));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artworks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        notifications.show({
          title: 'Thành công! 🎉',
          message: 'Artwork của bạn đã được đăng tải',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        router.push('/dashboard/works');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      notifications.show({
        title: 'Lỗi upload',
        message: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setLoading(false);
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
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />

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
                      <Button variant="subtle" size="xs" color="red" onClick={() => setFiles([])}>
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
                        <ActionIcon
                          variant="filled"
                          color="red"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
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
                {...form.getInputProps('title')}
              />

              <Textarea
                label="Description"
                placeholder="Tell the story behind your art..."
                minRows={4}
                {...form.getInputProps('description')}
              />

              <TagsInput
                label="Tags"
                placeholder="Add tags (press Enter)"
                description="Minimum 1 tag required. Suggested: #anime, #landscape, #portrait"
                {...form.getInputProps('tags')}
              />
            </Stack>
          </Paper>

          {/* Content Rating */}
          <Paper p="xl" radius="lg" withBorder>
            <Title order={4} mb="md">
              Content Rating
            </Title>

            <Radio.Group {...form.getInputProps('rating')}>
              <Stack gap="sm">
                <Radio value="SAFE" label="Safe - General audience" />
                <Radio value="R18" label="R-18 / NSFW - Adult content" />
                <Radio value="R18G" label="R-18G / Gore - Graphic violent content" />
              </Stack>
            </Radio.Group>

            <Switch
              label="AI Generated"
              description="Created with AI tools"
              mt="lg"
              {...form.getInputProps('isAI', { type: 'checkbox' })}
              thumbIcon={<IconRobot size={12} />}
            />
          </Paper>

          {/* Action Buttons */}
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={() => router.back()}>
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
