'use client';

import { useAuth } from '@clerk/nextjs';
import { Box, Flex } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminSidebar } from '@/components/admin';

const ALLOWED_ROLES = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.replace('/dashboard');
        return;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (!ALLOWED_ROLES.includes(data.role)) {
          router.replace('/dashboard');
          return;
        }
        setRole(data.role);
      } else {
        router.replace('/dashboard');
      }
    } catch {
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [router, getToken]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  if (loading && !role) {
    return null;
  }

  return (
    <Box maw={1400} mx="auto" px={{ base: 'md', md: 'xl' }} py="xl">
      <Flex direction={{ base: 'column', lg: 'row' }} gap="xl">
        <AdminSidebar role={role} loading={loading} />
        <Box flex={1} miw={0}>
          {children}
        </Box>
      </Flex>
    </Box>
  );
}
