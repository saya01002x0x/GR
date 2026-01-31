'use client';

import {
  Box,
  Collapse,
  NavLink,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import {
  IconBell,
  IconBrush,
  IconChartBar,
  IconChevronDown,
  IconChevronRight,
  IconCrown,
  IconEye,
  IconPalette,
  IconPhoto,
  IconSettings,
  IconShield,
  IconUpload,
  IconUser,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const iconMap: Record<string, React.ElementType> = {
  'general': IconSettings,
  'profile': IconUser,
  'content': IconEye,
  'notifications': IconBell,
  'membership': IconCrown,
  'security': IconShield,
  'my-works': IconPhoto,
  'upload': IconUpload,
  'analytics': IconChartBar,
  'commissions': IconPalette,
};

const settingsMenuItems = [
  { id: 'general', label: 'General', href: '/dashboard/general' },
  { id: 'profile', label: 'Profile', href: '/dashboard/profile' },
  { id: 'content', label: 'Content Preferences', href: '/dashboard/content' },
  { id: 'notifications', label: 'Notifications', href: '/dashboard/notifications' },
  { id: 'membership', label: 'Membership', href: '/dashboard/membership' },
  { id: 'security', label: 'Security', href: '/dashboard/security' },
];

const creatorMenuItems = [
  { id: 'my-works', label: 'My Works', href: '/dashboard/works' },
  { id: 'upload', label: 'Upload New', href: '/upload' },
  { id: 'analytics', label: 'Analytics', href: '/dashboard/analytics' },
  { id: 'commissions', label: 'Commissions', href: '/dashboard/commissions' },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [creatorOpen, setCreatorOpen] = useState(false);

  const isActive = (href: string) => {
    // Remove locale prefix for comparison
    const cleanPath = pathname.replace(/^\/[a-z]{2}/, '');
    return cleanPath === href || cleanPath.startsWith(`${href}/`);
  };

  return (
    <Box
      w={280}
      style={{
        position: 'sticky',
        top: 88, // 64px header + 24px padding
        alignSelf: 'flex-start',
      }}
      visibleFrom="lg"
    >
      <Stack gap={4}>
        {/* Settings Menu */}
        {settingsMenuItems.map((item) => {
          const Icon = iconMap[item.id] ?? IconSettings;
          const active = isActive(item.href);

          return (
            <NavLink
              key={item.id}
              component={Link}
              href={item.href}
              label={item.label}
              leftSection={<Icon size={20} />}
              active={active}
              variant="light"
              color="primary"
              style={{
                borderRadius: 'var(--mantine-radius-md)',
              }}
            />
          );
        })}

        {/* Divider */}
        <Box my="sm" h={1} bg="gray.2" />

        {/* Content Creator Section */}
        <UnstyledButton
          onClick={() => setCreatorOpen(o => !o)}
          py="xs"
          px="sm"
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--mantine-spacing-sm)',
          }}
        >
          <IconBrush size={20} color="var(--mantine-color-primary-6)" />
          <Text size="sm" fw={600} flex={1}>
            Content Creator
          </Text>
          {creatorOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
        </UnstyledButton>

        <Collapse in={creatorOpen}>
          <Stack gap={4} pl="md">
            {creatorMenuItems.map((item) => {
              const Icon = iconMap[item.id] ?? IconSettings;
              const active = isActive(item.href);

              return (
                <NavLink
                  key={item.id}
                  component={Link}
                  href={item.href}
                  label={item.label}
                  leftSection={<Icon size={18} />}
                  active={active}
                  variant="light"
                  color="primary"
                  style={{
                    borderRadius: 'var(--mantine-radius-md)',
                  }}
                />
              );
            })}
          </Stack>
        </Collapse>
      </Stack>
    </Box>
  );
}
