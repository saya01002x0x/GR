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
    setFiles(acceptedFiles);
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
      files.forEach(file => formData.append('images', file));

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
            Chỉ Artist mới có thể Upload
          </Title>
          <Text c="dimmed" mt="sm">
            Vui lòng đăng ký trở thành Artist trong trang Dashboard để bắt đầu chia sẻ artwork.
          </Text>
          <Button mt="lg" onClick={() => router.push('/dashboard/general')}>
            Đến Dashboard
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
            {previews.length > 0
              ? (
                  <Stack gap="md">
                    {previews.map((url, index) => (
                      <Box key={url} pos="relative">
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          radius="md"
                          fit="contain"
                          mah={400}
                        />
                        <ActionIcon
                          pos="absolute"
                          top={8}
                          right={8}
                          variant="filled"
                          color="red"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <IconX size={16} />
                        </ActionIcon>
                      </Box>
                    ))}
                    <Button variant="light" onClick={() => setFiles([])}>
                      Chọn ảnh khác
                    </Button>
                  </Stack>
                )
              : (
                  <Dropzone
                    onDrop={handleDrop}
                    accept={IMAGE_MIME_TYPE}
                    maxSize={20 * 1024 * 1024}
                    multiple={false}
                  >
                    <Group justify="center" gap="xl" py="xl" style={{ pointerEvents: 'none' }}>
                      <Dropzone.Accept>
                        <IconCloudUpload size={52} color="var(--mantine-color-primary-6)" />
                      </Dropzone.Accept>
                      <Dropzone.Reject>
                        <IconX size={52} color="var(--mantine-color-red-6)" />
                      </Dropzone.Reject>
                      <Dropzone.Idle>
                        <IconCloudUpload size={52} color="var(--mantine-color-dimmed)" />
                      </Dropzone.Idle>

                      <Stack gap={4} align="center">
                        <Text size="lg" fw={700}>
                          Drag and drop your art here
                        </Text>
                        <Text size="sm" c="dimmed">
                          Supports JPG, PNG, GIF up to 20MB
                        </Text>
                      </Stack>
                    </Group>
                  </Dropzone>
                )}

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
