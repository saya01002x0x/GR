'use client';

import { Box, Stack } from '@mantine/core';
import { usePathname } from 'next/navigation';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';

type AppLayoutShellProps = {
  children: React.ReactNode;
};

export function AppLayoutShell({ children }: AppLayoutShellProps) {
  const pathname = usePathname();

  // Check if current path is a landing page (e.g., '/', '/en', '/vi')
  // We match paths that are just the locale or empty
  const isLandingPage = pathname === '/' || /^\/[a-z]{2}\/?$/.test(pathname);

  return (
    <Stack gap={0} mih="100vh">
      <AppHeader />
      <Box component="main" flex={1}>
        {children}
      </Box>
      {!isLandingPage && <AppFooter />}
    </Stack>
  );
}
