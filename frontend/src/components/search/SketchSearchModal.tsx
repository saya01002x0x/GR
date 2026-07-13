'use client';

import {
  ActionIcon,
  Box,
  Button,
  Card,
  Center,
  ColorSwatch,
  Grid,
  Group,
  Loader,
  Modal,
  Slider,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconBrush, IconEraser, IconSearch, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAiSearchSketch } from '@/api/hooks/use-search';
import { ArtworkCard } from '@/components/artwork';

type Props = {
  opened: boolean;
  onClose: () => void;
};

export function SketchSearchModal({ opened, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState(5);

  const sketchMutation = useAiSearchSketch();

  useEffect(() => {
    if (opened && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      sketchMutation.reset();
    }
  }, [opened, sketchMutation]);

  const getPointerPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) {
        return null;
      }

      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    const point = getPointerPosition(e);
    if (!ctx || !point) {
      return;
    }

    ctx.lineWidth = brushSize;
    ctx.strokeStyle = tool === 'eraser' ? 'white' : 'black';

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const point = getPointerPosition(e);
    if (ctx && point) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    sketchMutation.reset();
  };

  const handleSearch = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const base64 = canvas.toDataURL('image/png');
      sketchMutation.mutate(base64);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="70rem"
      title={(
        <Box>
          <Title order={2}>Search by Sketch</Title>
          <Text size="sm" c="dimmed">
            Draw a rough concept or upload a doodle to find similar artworks in our community.
          </Text>
        </Box>
      )}
    >
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          {/* Toolbar */}
          <Card withBorder padding="xs" mb="sm" radius="md">
            <Group justify="space-between">
              <Group>
                <ActionIcon
                  variant={tool === 'pen' ? 'light' : 'subtle'}
                  color="red"
                  onClick={() => setTool('pen')}
                >
                  <IconBrush size={20} />
                </ActionIcon>
                <ActionIcon
                  variant={tool === 'eraser' ? 'light' : 'subtle'}
                  color="gray"
                  onClick={() => setTool('eraser')}
                >
                  <IconEraser size={20} />
                </ActionIcon>
                <Box w={100} ml="md">
                  <Slider
                    value={brushSize}
                    onChange={setBrushSize}
                    min={1}
                    max={50}
                    color={tool === 'eraser' ? 'gray' : 'red'}
                    label={null}
                  />
                </Box>
              </Group>
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={clearCanvas}
              >
                Clear
              </Button>
            </Group>
          </Card>

          {/* Canvas */}
          <Box
            style={{
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: 'var(--mantine-radius-md)',
              overflow: 'hidden',
              cursor: tool === 'eraser' ? 'crosshair' : 'crosshair',
            }}
          >
            <canvas
              ref={canvasRef}
              width={600}
              height={400}
              style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onBlur={stopDrawing}
              onMouseMove={draw}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
            />
          </Box>

          <Button
            fullWidth
            size="lg"
            mt="md"
            variant="gradient"
            gradient={{ from: 'red', to: 'pink', deg: 45 }}
            leftSection={<IconSearch size={20} />}
            onClick={handleSearch}
            loading={sketchMutation.isPending}
          >
            Search Artworks
          </Button>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          {/* Mood Palette Mock */}
          <Card withBorder radius="md">
            <Group mb="md">
              <ThemeIcon variant="light" color="red" size="sm" radius="xl">
                <IconBrush size={14} />
              </ThemeIcon>
              <Text fw={600}>Mood Palette</Text>
            </Group>
            <Text size="xs" c="dimmed" mb="md">
              Select dominant colors to guide the search.
            </Text>
            <Group gap="xs">
              <ColorSwatch color="#000000" />
              <ColorSwatch color="#ffffff" style={{ border: '1px solid #eee' }} />
              <ColorSwatch color="#f03e3e" />
              <ColorSwatch color="#339af0" />
              <ColorSwatch color="#20c997" />
              <ColorSwatch color="#f59f00" />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Results Section */}
      <Box mt="xl">
        {sketchMutation.isPending && (
          <Center py="xl">
            <Loader color="red" />
          </Center>
        )}

        {sketchMutation.isError && (
          <Center py="xl">
            <Text c="red">Failed to search by sketch. Please try again.</Text>
          </Center>
        )}

        {sketchMutation.data && sketchMutation.data.hits?.length > 0 && (
          <>
            <Title order={3} mb="md">Search Results</Title>
            <Grid gutter="md">
              {sketchMutation.data.hits.map((artwork: any) => (
                <Grid.Col key={artwork.id} span={{ base: 6, sm: 4, lg: 3 }}>
                  <Link href={`/artworks/${artwork.id}`} style={{ textDecoration: 'none' }} onClick={onClose}>
                    <ArtworkCard
                      title={artwork.title}
                      image={artwork.thumbnail || artwork.images?.[0]?.url || artwork.images?.[0]?.thumbnailUrl}
                      artist={artwork.author?.displayName || artwork.author?.username || 'Unknown'}
                      artistAvatar={artwork.author?.avatar}
                      size="sm"
                    />
                  </Link>
                </Grid.Col>
              ))}
            </Grid>
          </>
        )}

        {sketchMutation.data && sketchMutation.data.hits?.length === 0 && (
          <Center py="xl">
            <Text c="dimmed">No similar artworks found. Try drawing something else!</Text>
          </Center>
        )}
      </Box>
    </Modal>
  );
}
