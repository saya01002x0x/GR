'use client';

import type { MantineColorsTuple } from '@mantine/core';
import { MantineProvider as BaseMantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

// Import Mantine core styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// Custom theme configuration for ArtSpace
// See: https://mantine.dev/theming/theme-object/

// Primary color: #e52e5c (Rose/Pink from ArtSpace design)
const primaryColor: MantineColorsTuple = [
  '#fff0f3', // 0 - lightest
  '#ffe0e6', // 1
  '#ffc0cc', // 2
  '#ff9aad', // 3
  '#f46d88', // 4
  '#e94d6d', // 5
  '#e52e5c', // 6 - main color
  '#d01a4a', // 7
  '#b0153f', // 8
  '#8f1235', // 9 - darkest
];

const theme = createTheme({
  // Primary color for the app
  primaryColor: 'primary',
  colors: {
    primary: primaryColor,
  },

  // Font configuration - Plus Jakarta Sans
  fontFamily: '"Plus Jakarta Sans", var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
  fontFamilyMonospace: 'var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace)',

  // Heading configuration
  headings: {
    fontFamily: '"Plus Jakarta Sans", var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    fontWeight: '700',
  },

  // Border radius (matching ArtSpace design)
  radius: {
    xs: '0.25rem',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },

  // Default radius for components
  defaultRadius: 'md',

  // Respect user's reduced motion preference
  respectReducedMotion: true,
});

export function MantineProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseMantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" autoClose={3000} zIndex={1000} />
      {children}
    </BaseMantineProvider>
  );
}
