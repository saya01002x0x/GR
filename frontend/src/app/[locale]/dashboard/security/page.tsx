'use client';

import { UserProfile } from '@clerk/nextjs';
import { Box, Flex, Stack, Text, Title } from '@mantine/core';
import { DashboardSidebar } from '@/components/dashboard';

export default function SecuritySettingsPage() {
  return (
    <Box maw={1400} mx="auto" px={{ base: 'md', md: 'xl' }} py="xl">
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        gap="xl"
      >
        <DashboardSidebar />
        <Box flex={1} miw={0}>
          <Stack gap="xl">
            {/* Page Header */}
            <Box pb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
              <Title order={2} mb="xs">
                Security Settings
              </Title>
              <Text c="dimmed" size="sm">
                Manage your password, two-factor authentication, and connected accounts.
              </Text>
            </Box>

            {/* Clerk UserProfile Component - handles password, 2FA, connected accounts */}
            <UserProfile
              appearance={{
                elements: {
                  rootBox: {
                    width: '100%',
                  },
                  card: {
                    boxShadow: 'none',
                    border: '1px solid var(--mantine-color-gray-3)',
                    borderRadius: 'var(--mantine-radius-lg)',
                  },
                },
              }}
            />
          </Stack>
        </Box>
      </Flex>
    </Box>
  );
}
