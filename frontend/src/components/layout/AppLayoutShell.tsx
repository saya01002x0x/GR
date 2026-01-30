'use client';

import { Box, Stack } from '@mantine/core';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';

type AppLayoutShellProps = {
  children: React.ReactNode;
};

export function AppLayoutShell({ children }: AppLayoutShellProps) {
  return (
    <Stack gap={0} mih="100vh">
      <AppHeader />
      <Box component="main" flex={1}>
        {children}
      </Box>
      <AppFooter />
    </Stack>
  );
}
