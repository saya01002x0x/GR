'use client';

import {
  ActionIcon,
  Box,
  Button,
  Card,
  ColorSwatch,
  Grid,
  Group,
  Modal,
  Slider,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconBrush, IconEraser, IconSearch, IconTrash, IconUpload } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

type Props = {
  opened: boolean;
  onClose: () => void;
  onSearch: (base64: string) => void;
};

export function SketchSearchModal({ opened, onClose, onSearch }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState(5);

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
    }
  }, [opened]);

  const getPointerPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) {
        return null;
      }

      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
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
  };

  const handleSearch = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const base64 = canvas.toDataURL('image/png');
      onSearch(base64);
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
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
          >
            Search Artworks
          </Button>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          {/* Upload Reference Mock */}
          <Card withBorder radius="md" mb="md">
            <Group mb="md">
              <IconUpload size={20} color="var(--mantine-color-red-6)" />
              <Text fw={600}>Upload Reference</Text>
            </Group>
            <Box
              p="xl"
              style={{
                border: '2px dashed var(--mantine-color-gray-3)',
                borderRadius: 'var(--mantine-radius-md)',
                textAlign: 'center',
                backgroundColor: 'var(--mantine-color-gray-0)',
              }}
            >
              <Text size="sm" c="dimmed">
                Drag & drop a rough sketch or
              </Text>
              <Text size="sm" c="red" fw={500} style={{ cursor: 'pointer' }}>
                Browse files
              </Text>
            </Box>
          </Card>

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
    </Modal>
  );
}
