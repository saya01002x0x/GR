export const WATERMARK_POSITIONS = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const;

export type WatermarkPosition = (typeof WATERMARK_POSITIONS)[number];

export type WatermarkSettings = {
  enabled: boolean;
  position: WatermarkPosition;
  opacity: number; // 10-100
  size: number; // 5-40 (% of image width)
};

export type ImageWatermarkMeta = {
  enabled: boolean;
  position?: WatermarkPosition;
  opacity?: number;
  size?: number;
};

export const DEFAULT_WATERMARK_SETTINGS: WatermarkSettings = {
  enabled: false,
  position: 'bottom-right',
  opacity: 40,
  size: 15,
};
