'use client';

import { Box, Stack } from '@mantine/core';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';

type ArtistsLayoutShellProps = {
  children: React.ReactNode;
};

export function ArtistsLayoutShell({ children }: ArtistsLayoutShellProps) {
  return (
    <Stack gap={0} mih="100vh">
      <AppHeader />
      <Box component="main" flex={1} maw={1440} mx="auto" w="100%" pb="xl">
        {children}
      </Box>
      <AppFooter />
    </Stack>
  );
}
