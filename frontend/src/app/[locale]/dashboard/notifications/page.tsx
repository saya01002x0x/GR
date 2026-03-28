'use client';

import { Box, Flex } from '@mantine/core';
import { DashboardSidebar, NotificationSettings } from '@/components/dashboard';

export default function NotificationsPage() {
  return (
    <Box maw={1400} mx="auto" px={{ base: 'md', md: 'xl' }} py="xl">
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        gap="xl"
      >
        <DashboardSidebar />
        <Box flex={1} miw={0}>
          <NotificationSettings />
        </Box>
      </Flex>
    </Box>
  );
}
