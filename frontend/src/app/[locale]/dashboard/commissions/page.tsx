'use client';

import { Box, Flex } from '@mantine/core';
import { ArtistTiers, DashboardSidebar } from '@/components/dashboard';

export default function CommissionsPage() {
  return (
    <Box maw={1400} mx="auto" px={{ base: 'md', md: 'xl' }} py="xl">
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        gap="xl"
      >
        <DashboardSidebar />
        <Box flex={1} miw={0}>
          <ArtistTiers />
        </Box>
      </Flex>
    </Box>
  );
}
