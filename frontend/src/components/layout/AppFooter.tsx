'use client';

import {
  Anchor,
  Box,
  Group,
  Text,
} from '@mantine/core';

// Logo SVG component (simplified version for footer)
function LogoIconSmall() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AppFooter() {
  return (
    <Box
      component="footer"
      py="xl"
      mt="auto"
      style={{
        borderTop: '1px solid var(--mantine-color-gray-2)',
      }}
    >
      <Group
        justify="space-between"
        align="center"
        maw={1440}
        mx="auto"
        px={{ base: 'md', md: 'xl' }}
        wrap="wrap"
        gap="md"
      >
        <Group gap="xs">
          <Box c="primary">
            <LogoIconSmall />
          </Box>
          <Text size="sm" c="dimmed">
            © 2024 ArtSpace Inc.
          </Text>
        </Group>

        <Group gap="xl">
          <Anchor href="#" size="sm" c="dimmed" underline="hover">
            Privacy
          </Anchor>
          <Anchor href="#" size="sm" c="dimmed" underline="hover">
            Terms
          </Anchor>
          <Anchor href="#" size="sm" c="dimmed" underline="hover">
            Help
          </Anchor>
        </Group>
      </Group>
    </Box>
  );
}
