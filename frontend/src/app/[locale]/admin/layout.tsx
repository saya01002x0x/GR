'use client';

import { Box, Flex } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAdminUserProfile } from '@/api/hooks';
import { AdminSidebar } from '@/components/admin';

const ALLOWED_ROLES = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isLoading } = useAdminUserProfile();

  useEffect(() => {
    if (!isLoading) {
      if (!data?.role || !ALLOWED_ROLES.includes(data.role)) {
        router.replace('/dashboard');
      }
    }
  }, [data, isLoading, router]);

  if (isLoading && !data) {
    return null;
  }

  return (
    <Box maw={1400} mx="auto" px={{ base: 'md', md: 'xl' }} py="xl">
      <Flex direction={{ base: 'column', lg: 'row' }} gap="xl">
        <AdminSidebar role={data?.role ?? null} loading={isLoading} />
        <Box flex={1} miw={0}>
          {children}
        </Box>
      </Flex>
    </Box>
  );
}
