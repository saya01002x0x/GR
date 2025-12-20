'use client';

import type { MantineColorsTuple } from '@mantine/core';
import { MantineProvider as BaseMantineProvider, ColorSchemeScript, createTheme } from '@mantine/core';

// Import Mantine core styles
import '@mantine/core/styles.css';

// Custom theme configuration
// See: https://mantine.dev/theming/theme-object/
const primaryColor: MantineColorsTuple = [
  '#e5f4ff',
  '#cde2ff',
  '#9bc2ff',
  '#64a0ff',
  '#3984fe',
  '#1d72fe',
  '#0969ff',
  '#0058e4',
  '#004ecc',
  '#0043b5',
];

const theme = createTheme({
  // Primary color for the app
  primaryColor: 'primary',
  colors: {
    primary: primaryColor,
  },

  // Font configuration
  fontFamily: 'var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
  fontFamilyMonospace: 'var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace)',

  // Heading configuration
  headings: {
    fontFamily: 'var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    fontWeight: '600',
  },

  // Border radius
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

export function MantineColorSchemeScript() {
  return <ColorSchemeScript defaultColorScheme="auto" />;
}

export function MantineProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseMantineProvider theme={theme} defaultColorScheme="auto">
      {children}
    </BaseMantineProvider>
  );
}
