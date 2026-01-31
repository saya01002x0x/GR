'use client';

import { Box, Flex } from '@mantine/core';
import { DashboardSidebar, MembershipPlan } from '@/components/dashboard';

export default function MembershipPage() {
  return (
    <Box maw={1400} mx="auto" px={{ base: 'md', md: 'xl' }} py="xl">
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        gap="xl"
      >
        <DashboardSidebar />
        <Box flex={1} miw={0}>
          <MembershipPlan />
        </Box>
      </Flex>
    </Box>
  );
}
