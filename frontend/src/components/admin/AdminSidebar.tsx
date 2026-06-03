'use client';

import { Box, Loader, NavLink, Stack, Text } from '@mantine/core';
import {
  IconChartBar,
  IconCurrencyDollar,
  IconDashboard,
  IconGavel,
  IconReport,
  IconScale,
  IconShieldCheck,
  IconSpeakerphone,
  IconUsers,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type AdminSidebarProps = {
  role: string | null;
  loading?: boolean;
};

const ROLE_LEVEL: Record<string, number> = {
  MODERATOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

type MenuItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  minRole: number;
};

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin', icon: IconDashboard, minRole: 1 },
  { id: 'moderation', label: 'Content Moderation', href: '/admin/moderation', icon: IconGavel, minRole: 1 },
  { id: 'users', label: 'User Management', href: '/admin/users', icon: IconUsers, minRole: 1 },
  { id: 'payouts', label: 'Payout Requests', href: '/admin/payouts', icon: IconCurrencyDollar, minRole: 2 },
  { id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: IconChartBar, minRole: 2 },
  { id: 'ranking', label: 'Dynamic Ranking', href: '/admin/ranking', icon: IconScale, minRole: 2 },
  { id: 'announcements', label: 'Announcements', href: '/admin/announcements', icon: IconSpeakerphone, minRole: 2 },
  { id: 'staff', label: 'Staff Management', href: '/admin/staff', icon: IconShieldCheck, minRole: 3 },
  { id: 'audit-logs', label: 'Audit Logs', href: '/admin/audit-logs', icon: IconReport, minRole: 3 },
];

export function AdminSidebar({ role, loading }: AdminSidebarProps) {
  const pathname = usePathname();
  const userLevel = ROLE_LEVEL[role ?? ''] ?? 0;

  const isActive = (href: string) => {
    const cleanPath = pathname.replace(/^\/[a-z]{2}/, '');
    if (href === '/admin') {
      return cleanPath === '/admin';
    }
    return cleanPath.startsWith(href);
  };

  const visibleItems = menuItems.filter(item => userLevel >= item.minRole);

  if (loading) {
    return (
      <Box w={260} py="xl" ta="center">
        <Loader size="sm" />
      </Box>
    );
  }

  return (
    <Box
      w={260}
      style={{
        position: 'sticky',
        top: 88,
        alignSelf: 'flex-start',
      }}
      visibleFrom="lg"
    >
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm" px="sm">
        Admin Panel
      </Text>
      <Stack gap={4}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              component={Link}
              href={item.href}
              label={item.label}
              leftSection={<Icon size={20} />}
              active={isActive(item.href)}
              variant="light"
              color="primary"
              style={{ borderRadius: 'var(--mantine-radius-md)' }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
