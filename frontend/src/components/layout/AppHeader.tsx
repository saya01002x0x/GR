'use client';

import { SignInButton, useAuth, useClerk, useUser } from '@clerk/nextjs';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Menu,
  Text,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconGavel,
  IconLogout,
  IconMail,
  IconMoon,
  IconSettings,
  IconSun,
  IconUser,
} from '@tabler/icons-react';
import Link from 'next/link';
import { Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { SearchBar } from '@/components/search';
import { NotificationBell } from './NotificationBell';

// Logo SVG component
function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z"
        fill="currentColor"
      />
    </svg>
  );
}

const STAFF_ROLES = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function AppHeader() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const { toggleColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }
    let cancelled = false;
    async function loadRole() {
      try {
        const token = await getToken();
        if (!token || cancelled) {
          return;
        }
        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setUserRole(data.role);
        }
      } catch { /* ignore */ }
    }
    loadRole();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);

  const isStaff = userRole != null && STAFF_ROLES.includes(userRole);

  const mounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false,
  );

  return (
    <Box
      component="header"
      h={64}
      px={{ base: 'md', md: 'xl' }}
      style={{
        borderBottom: '1px solid var(--mantine-color-gray-2)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--mantine-color-body)',
      }}
    >
      <Group h="100%" justify="space-between" gap="md" maw={1440} mx="auto">
        {/* Logo & Search */}
        <Group gap="xl" flex={1}>
          <Box
            component={Link}
            href="/"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Box c="primary">
              <LogoIcon size={32} />
            </Box>
            <Text fw={700} fz="xl" c="dark" visibleFrom="md">
              ArtSpace
            </Text>
          </Box>

          <Box flex={1} maw={400} visibleFrom="md">
            <Suspense fallback={<Box h={36} />}>
              <SearchBar
                placeholder="Search artworks, users..."
                size="md"
                radius="md"
                leftSectionSize={18}
              />
            </Suspense>
          </Box>
        </Group>

        {/* Right Actions - Varies by auth state */}
        {isLoaded && isSignedIn
          ? (
            // ========== LOGGED IN STATE ==========
              <Group gap="sm">
                <Button
                  component={Link}
                  href="/upload"
                  radius="md"
                  visibleFrom="md"
                >
                  Upload Work
                </Button>

                {/* Theme Toggle */}
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  radius="md"
                  onClick={() => toggleColorScheme()}
                  aria-label="Toggle color scheme"
                >
                  {mounted
                    ? (computedColorScheme === 'dark'
                        ? <IconSun size={22} />
                        : <IconMoon size={22} />)
                    : <IconSun size={22} />}
                </ActionIcon>

                <NotificationBell />

                <ActionIcon variant="subtle" size="lg" radius="md">
                  <IconMail size={22} />
                </ActionIcon>

                {/* User Avatar Menu */}
                <Menu shadow="md" width={200} position="bottom-end">
                  <Menu.Target>
                    <Avatar
                      src={user?.imageUrl}
                      size={36}
                      radius="xl"
                      style={{ cursor: 'pointer' }}
                      alt={user?.fullName || 'User avatar'}
                    />
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {user?.fullName || user?.primaryEmailAddress?.emailAddress}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        @
                        {user?.username || 'user'}
                      </Text>
                    </Menu.Label>
                    <Menu.Divider />
                    <Menu.Item
                      component={Link}
                      href="/dashboard/profile"
                      leftSection={<IconUser size={16} />}
                    >
                      My Profile
                    </Menu.Item>
                    {isStaff && (
                      <Menu.Item
                        component={Link}
                        href="/admin/"
                        leftSection={<IconGavel size={16} />}
                      >
                        Admin Panel
                      </Menu.Item>
                    )}
                    <Menu.Item
                      component={Link}
                      href="/dashboard/general"
                      leftSection={<IconSettings size={16} />}
                    >
                      Settings
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconLogout size={16} />}
                      onClick={() => signOut()}
                    >
                      Sign Out
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            )
          : (
            // ========== LOGGED OUT STATE ==========
              <Group gap="sm">
                {/* Theme Toggle for logged out users too */}
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  radius="md"
                  onClick={() => toggleColorScheme()}
                  aria-label="Toggle color scheme"
                >
                  {mounted
                    ? (computedColorScheme === 'dark'
                        ? <IconSun size={22} />
                        : <IconMoon size={22} />)
                    : <IconSun size={22} />}
                </ActionIcon>

                <SignInButton mode="modal">
                  <Button variant="subtle" radius="md">
                    Sign In
                  </Button>
                </SignInButton>
                <SignInButton mode="modal">
                  <Button radius="md">
                    Get Started
                  </Button>
                </SignInButton>
              </Group>
            )}
      </Group>
    </Box>
  );
}
