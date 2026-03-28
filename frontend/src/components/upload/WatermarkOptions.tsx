'use client';

import type { WatermarkPosition, WatermarkSettings } from '@/types/watermark';
import {
  Box,
  Collapse,
  Group,
  SimpleGrid,
  Slider,
  Stack,
  Switch,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { IconDroplet, IconPhoto } from '@tabler/icons-react';
import { WATERMARK_POSITIONS } from '@/types/watermark';
import classes from './WatermarkOptions.module.css';

type WatermarkOptionsProps = {
  value: WatermarkSettings;
  onChange: (settings: WatermarkSettings) => void;
  disabled?: boolean;
};

const POSITION_LABELS: Record<WatermarkPosition, string> = {
  'top-left': 'Top Left',
  'top-center': 'Top Center',
  'top-right': 'Top Right',
  'middle-left': 'Middle Left',
  'center': 'Center',
  'middle-right': 'Middle Right',
  'bottom-left': 'Bottom Left',
  'bottom-center': 'Bottom Center',
  'bottom-right': 'Bottom Right',
};

export function WatermarkOptions({ value, onChange, disabled }: WatermarkOptionsProps) {
  const update = (partial: Partial<WatermarkSettings>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <Stack gap="md">
      <Switch
        label="Apply Watermark to Images"
        description="Overlay a watermark on your artwork to protect ownership"
        checked={value.enabled}
        onChange={e => update({ enabled: e.currentTarget.checked })}
        disabled={disabled}
        thumbIcon={<IconPhoto size={12} />}
      />

      <Collapse in={value.enabled}>
        <Stack gap="md" pt="xs">
          {/* Position Grid */}
          <Box>
            <Text size="sm" fw={500} mb={6}>
              Position
            </Text>
            <SimpleGrid cols={3} spacing={4} className={classes.positionGrid}>
              {WATERMARK_POSITIONS.map(pos => (
                <UnstyledButton
                  key={pos}
                  className={classes.positionCell}
                  data-selected={value.position === pos || undefined}
                  onClick={() => update({ position: pos })}
                  disabled={disabled}
                  title={POSITION_LABELS[pos]}
                >
                  <span className={classes.dot} />
                </UnstyledButton>
              ))}
            </SimpleGrid>
            <Text size="xs" c="dimmed" mt={4}>
              {POSITION_LABELS[value.position]}
            </Text>
          </Box>

          {/* Opacity Slider */}
          <Box>
            <Group justify="space-between" mb={6}>
              <Group gap={6}>
                <IconDroplet size={14} />
                <Text size="sm" fw={500}>
                  Visibility
                </Text>
              </Group>
              <Text size="xs" c="dimmed">
                {value.opacity}
                %
              </Text>
            </Group>
            <Slider
              value={value.opacity}
              onChange={v => update({ opacity: v })}
              min={10}
              max={100}
              step={5}
              label={v => `${v}%`}
              disabled={disabled}
              marks={[
                { value: 10, label: '10%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' },
              ]}
            />
          </Box>

          {/* Size Slider */}
          <Box mt="xs">
            <Group justify="space-between" mb={6}>
              <Text size="sm" fw={500}>
                Size
              </Text>
              <Text size="xs" c="dimmed">
                {value.size}
                %
              </Text>
            </Group>
            <Slider
              value={value.size}
              onChange={v => update({ size: v })}
              min={5}
              max={40}
              step={1}
              label={v => `${v}%`}
              disabled={disabled}
              marks={[
                { value: 5, label: '5%' },
                { value: 20, label: '20%' },
                { value: 40, label: '40%' },
              ]}
            />
          </Box>
        </Stack>
      </Collapse>
    </Stack>
  );
}
