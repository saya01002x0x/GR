'use client';

import {
  ActionIcon,
  Box,
  Image,
} from '@mantine/core';
import { IconMaximize } from '@tabler/icons-react';
import { useState } from 'react';

type ArtworkImageProps = {
  src: string;
  alt: string;
};

export function ArtworkImage({ src, alt }: ArtworkImageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    // TODO: Implement fullscreen modal
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Box pos="relative" mb="lg">
      {/* Main Image - width fills container, height auto based on aspect ratio */}
      <Image
        src={src}
        alt={alt}
        radius="md"
        style={{
          width: '100%',
          height: 'auto',
        }}
      />

      {/* Fullscreen Button */}
      <ActionIcon
        pos="absolute"
        top={12}
        right={12}
        variant="filled"
        color="dark"
        radius="md"
        size="lg"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={handleFullscreen}
      >
        <IconMaximize size={18} color="white" />
      </ActionIcon>
    </Box>
  );
}
