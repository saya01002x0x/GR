'use client';

import { useAuth } from '@clerk/nextjs';
import {
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Group,
  Loader,
  NavLink,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertTriangle,
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
  IconShieldOff,
  IconUpload,
  IconUser,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { BecomeArtistModal } from './BecomeArtistModal';

type UserInfo = {
  id: string;
  isArtist: boolean;
  warningCount?: number;
  isBanned?: boolean;
  bannedUntil?: string | null;
};

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
  const { getToken } = useAuth();
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserInfo = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUserInfo(data);
      }
    } catch {
      // Ignore error
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const isActive = (href: string) => {
    const cleanPath = pathname.replace(/^\/[a-z]{2}/, '');
    return cleanPath === href || cleanPath.startsWith(`${href}/`);
  };

  const handleBecomeArtistSuccess = () => {
    setUserInfo(prev => (prev ? { ...prev, isArtist: true } : prev));
  };

  return (
    <>
      <Box
        w={280}
        style={{
          position: 'sticky',
          top: 88,
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
                style={{ borderRadius: 'var(--mantine-radius-md)' }}
              />
            );
          })}

          {/* Divider */}
          <Box my="sm" h={1} bg="gray.2" />

          {/* Content Creator Section */}
          {loading
            ? (
                <Box py="md" ta="center">
                  <Loader size="sm" />
                </Box>
              )
            : userInfo?.isArtist
              ? (
                  <>
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
                              style={{ borderRadius: 'var(--mantine-radius-md)' }}
                            />
                          );
                        })}
                      </Stack>
                    </Collapse>
                  </>
                )
              : (
                  <Card withBorder p="md" radius="md">
                    <Stack gap="sm" align="center" ta="center">
                      <IconBrush size={32} color="var(--mantine-color-primary-6)" />
                      <Text size="sm" fw={600}>
                        Become an Artist
                      </Text>
                      <Text size="xs" c="dimmed">
                        Start sharing your artwork with the community
                      </Text>
                      <Button
                        size="xs"
                        fullWidth
                        onClick={openModal}
                        leftSection={<IconBrush size={14} />}
                      >
                        Sign up now
                      </Button>
                    </Stack>
                  </Card>
                )}

          {/* Warning Status */}
          {!loading && userInfo && (userInfo.warningCount ?? 0) > 0 && (
            <>
              <Box my="sm" h={1} bg="gray.2" />
              <Card
                withBorder
                p="md"
                radius="md"
                bg={userInfo.isBanned ? 'red.0' : 'orange.0'}
              >
                <Stack gap="xs">
                  <Group gap="xs">
                    <ThemeIcon
                      variant="light"
                      color={userInfo.isBanned ? 'red' : 'orange'}
                      size="sm"
                    >
                      {userInfo.isBanned
                        ? <IconShieldOff size={14} />
                        : <IconAlertTriangle size={14} />}
                    </ThemeIcon>
                    <Text size="sm" fw={600} c={userInfo.isBanned ? 'red' : 'orange.8'}>
                      {userInfo.isBanned ? 'Account banned' : 'Community warning'}
                    </Text>
                  </Group>

                  {userInfo.isBanned && userInfo.bannedUntil
                    ? (
                        <Text size="xs" c="red.7">
                          Unban:
                          {' '}
                          {new Date(userInfo.bannedUntil).toLocaleDateString('vi-VN')}
                        </Text>
                      )
                    : null}

                  {!userInfo.isBanned && (
                    <>
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">Warning level</Text>
                        <Badge
                          size="sm"
                          color={(userInfo.warningCount ?? 0) >= 3 ? 'red' : 'orange'}
                          variant="filled"
                        >
                          {userInfo.warningCount}
                          /3
                        </Badge>
                      </Group>
                      <Progress
                        value={((userInfo.warningCount ?? 0) / 3) * 100}
                        color={(userInfo.warningCount ?? 0) >= 2 ? 'red' : 'orange'}
                        size="sm"
                        radius="xl"
                      />
                      <Text size="xs" c="dimmed">
                        {3 - (userInfo.warningCount ?? 0)}
                        {' '}
                        more warnings will lead to a 7-day temp ban.
                        Warnings expire after 30 days.
                      </Text>
                    </>
                  )}
                </Stack>
              </Card>
            </>
          )}
        </Stack>
      </Box>

      <BecomeArtistModal
        opened={modalOpened}
        onClose={closeModal}
        onSuccess={handleBecomeArtistSuccess}
      />
    </>
  );
}
