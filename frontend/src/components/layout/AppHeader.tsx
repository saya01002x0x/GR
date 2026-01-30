'use client';

import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Text,
  TextInput,
} from '@mantine/core';
import {
  IconBell,
  IconMail,
  IconSearch,
} from '@tabler/icons-react';

// Logo SVG component
function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AppHeader() {
  return (
    <Box
      component="header"
      h={64}
      px={{ base: 'md', md: 'xl' }}
      style={{
        borderBottom: '1px solid var(--mantine-color-gray-2)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--mantine-color-body)',
      }}
    >
      <Group h="100%" justify="space-between" gap="md" maw={1440} mx="auto">
        {/* Logo & Search */}
        <Group gap="xl" flex={1}>
          <Box
            component="a"
            href="/"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Box c="primary">
              <LogoIcon size={32} />
            </Box>
            <Text fw={700} fz="xl" c="dark" visibleFrom="md">
              ArtSpace
            </Text>
          </Box>

          <TextInput
            placeholder="Search artworks, users..."
            leftSection={<IconSearch size={18} />}
            radius="md"
            flex={1}
            maw={400}
            visibleFrom="md"
          />
        </Group>

        {/* Right Actions */}
        <Group gap="sm">
          <Button
            radius="md"
            visibleFrom="md"
          >
            Upload Work
          </Button>

          <ActionIcon variant="subtle" size="lg" radius="md" c="dark">
            <IconBell size={22} />
          </ActionIcon>

          <ActionIcon variant="subtle" size="lg" radius="md" c="dark">
            <IconMail size={22} />
          </ActionIcon>

          <Avatar
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsKj89BM4hKMS4ZC6el3-BZY9nRoL2TVZT8kr5PFwPnrAj4o-QZM7jzegFoQt1oTZ59Z6VNJ_eySgBQl0ShCEx2TmNmd0KkXDxVIsz1cQcvk9l6O_Wr0FEW4ZriQ1xglPH6fto49ANwCFH0yCxYfET__7fWHCzUFQfYoRoIXevU3m0SLzZMoRcgT15_dAo7agHl44r1VWGB_QE_fMVpy--R_onaFOLYBlbLT8Lg7IqNvIeb_z106u5Y6-SJPd5u6lJFT7V-nt4ZUE"
            size={36}
            radius="xl"
            style={{ cursor: 'pointer' }}
          />
        </Group>
      </Group>
    </Box>
  );
}
