'use client';

import {
  ActionIcon,
  Box,
  Button,
  Group,
  Image,
  Stack,
  Text,
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconLayoutGrid, IconList } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

type ArtworkImage = {
  id: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  order: number;
};

type ArtworkImageGalleryProps = {
  images: ArtworkImage[];
  alt: string;
};

/**
 * ArtworkImageGallery - Multi-image viewer with pagination and scroll modes
 * Features:
 * - Pagination mode: Arrow navigation with keyboard support
 * - Scroll mode: All images stacked vertically
 * - Preloading: Adjacent images preloaded for smooth UX
 */
export function ArtworkImageGallery({ images, alt }: ArtworkImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'paginate' | 'scroll'>('paginate');

  // Sort images by order
  const sortedImages = [...images].sort((a, b) => a.order - b.order);
  const totalImages = sortedImages.length;
  const isSingleImage = totalImages <= 1;

  // Navigation functions with bounds checking
  const goNext = useCallback(() => {
    setCurrentIndex(i => Math.min(i + 1, totalImages - 1));
  }, [totalImages]);

  const goPrev = useCallback(() => {
    setCurrentIndex(i => Math.max(i - 1, 0));
  }, []);

  // Preload adjacent images for smooth navigation
  useEffect(() => {
    if (viewMode === 'paginate' && !isSingleImage) {
      const preloadIndices = [currentIndex - 1, currentIndex + 1]
        .filter(i => i >= 0 && i < totalImages);

      preloadIndices.forEach((i) => {
        const img = new window.Image();
        img.src = sortedImages[i]?.url ?? '';
      });
    }
  }, [currentIndex, sortedImages, totalImages, viewMode, isSingleImage]);

  // Keyboard navigation
  // ✅ FIX: Using functional state update to avoid stale closure
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'scroll' || isSingleImage) {
        return;
      }

      if (e.key === 'ArrowRight') {
        setCurrentIndex(i => Math.min(i + 1, totalImages - 1));
      }
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(i => Math.max(i - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalImages, viewMode, isSingleImage]);

  // Single image - simple display
  if (isSingleImage) {
    return (
      <Box pos="relative" mb="lg">
        <Image
          src={sortedImages[0]?.url}
          alt={alt}
          radius="md"
          style={{ width: '100%', height: 'auto' }}
        />
      </Box>
    );
  }

  // Scroll mode - all images stacked
  if (viewMode === 'scroll') {
    return (
      <Stack gap="md" mb="lg">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {totalImages}
            {' '}
            images
          </Text>
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconLayoutGrid size={14} />}
            onClick={() => setViewMode('paginate')}
          >
            Page View
          </Button>
        </Group>

        {sortedImages.map((img, i) => (
          <Box key={img.id} pos="relative">
            <Image
              src={img.url}
              alt={`${alt} - ${i + 1}`}
              radius="md"
              style={{ width: '100%', height: 'auto' }}
            />
            <Text size="xs" c="dimmed" ta="center" mt={4}>
              {i + 1}
              {' '}
              /
              {totalImages}
            </Text>
          </Box>
        ))}
      </Stack>
    );
  }

  // Pagination mode - single image with navigation
  const currentImage = sortedImages[currentIndex];
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalImages - 1;

  return (
    <Box pos="relative" mb="lg">
      {/* Main Image */}
      <Image
        src={currentImage?.url}
        alt={alt}
        radius="md"
        style={{ width: '100%', height: 'auto' }}
      />

      {/* Navigation Arrows */}
      {canGoPrev && (
        <ActionIcon
          pos="absolute"
          top="50%"
          left={12}
          variant="filled"
          color="dark"
          radius="xl"
          size="lg"
          style={{
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={goPrev}
        >
          <IconChevronLeft size={20} color="white" />
        </ActionIcon>
      )}

      {canGoNext && (
        <ActionIcon
          pos="absolute"
          top="50%"
          right={12}
          variant="filled"
          color="dark"
          radius="xl"
          size="lg"
          style={{
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={goNext}
        >
          <IconChevronRight size={20} color="white" />
        </ActionIcon>
      )}

      {/* Bottom Controls */}
      <Group
        pos="absolute"
        bottom={12}
        left="50%"
        style={{ transform: 'translateX(-50%)' }}
        gap="sm"
      >
        {/* Page Indicator */}
        <Box
          px="sm"
          py={4}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 'var(--mantine-radius-md)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Text size="sm" c="white" fw={500}>
            {currentIndex + 1}
            {' '}
            /
            {totalImages}
          </Text>
        </Box>

        {/* Mode Toggle */}
        <ActionIcon
          variant="filled"
          color="dark"
          radius="md"
          size="md"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setViewMode('scroll')}
          title="Scroll View"
        >
          <IconList size={16} color="white" />
        </ActionIcon>
      </Group>
    </Box>
  );
}
