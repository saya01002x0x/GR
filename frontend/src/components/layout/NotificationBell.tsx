'use client';

import { useAuth } from '@clerk/nextjs';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  CloseButton,
  Group,
  Indicator,
  Popover,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconBell,
  IconCheck,
  IconInfoCircle,
  IconShieldCheck,
  IconShieldOff,
} from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
};

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  WARNING: { icon: IconAlertTriangle, color: 'orange' },
  TEMP_BAN: { icon: IconShieldOff, color: 'red' },
  UNBAN: { icon: IconShieldCheck, color: 'green' },
  SYSTEM: { icon: IconInfoCircle, color: 'blue' },
  LIKE: { icon: IconInfoCircle, color: 'pink' },
  COMMENT: { icon: IconInfoCircle, color: 'cyan' },
  FOLLOW: { icon: IconInfoCircle, color: 'violet' },
};

function formatTimeAgo(dateStr: string, now: number) {
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) {
    return 'Vừa xong';
  }
  if (mins < 60) {
    return `${mins} phút trước`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return `${hrs} giờ trước`;
  }
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
}

export function NotificationBell() {
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [opened, setOpened] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const fetchNotifications = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        return;
      }
      const res = await fetch(`${API_URL}/notifications?limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items);
        setUnreadCount(data.unreadCount);
        setNow(Date.now());
      }
    } catch { /* ignore */ }
  }, [getToken]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = await getToken();
        if (!token || cancelled) {
          return;
        }
        const res = await fetch(`${API_URL}/notifications?limit=30`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setNotifications(data.items);
          setUnreadCount(data.unreadCount);
          setNow(Date.now());
        }
      } catch { /* ignore */ }
    }
    load();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [getToken, fetchNotifications]);

  const markRead = async (id: string) => {
    const token = await getToken();
    if (!token) {
      return;
    }
    await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    const token = await getToken();
    if (!token) {
      return;
    }
    await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = await getToken();
    if (!token) {
      return;
    }
    const wasUnread = notifications.find(n => n.id === id && !n.isRead);
    await fetch(`${API_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <Popover
      width={400}
      position="bottom-end"
      shadow="lg"
      opened={opened}
      onChange={setOpened}
    >
      <Popover.Target>
        <Indicator
          label={unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined}
          size={16}
          color="red"
          disabled={unreadCount === 0}
          offset={4}
        >
          <ActionIcon
            variant="subtle"
            size="lg"
            radius="md"
            onClick={() => setOpened(o => !o)}
          >
            <IconBell size={22} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
          <Group gap="xs">
            <Text fw={600} size="sm">Thông báo</Text>
            {unreadCount > 0 && (
              <Badge size="xs" color="red" variant="filled">{unreadCount}</Badge>
            )}
          </Group>
          {unreadCount > 0 && (
            <Button
              variant="subtle"
              size="compact-xs"
              leftSection={<IconCheck size={12} />}
              onClick={markAllRead}
            >
              Đọc tất cả
            </Button>
          )}
        </Group>

        <ScrollArea.Autosize mah={420}>
          {notifications.length === 0
            ? (
                <Box py="xl" ta="center">
                  <Text size="sm" c="dimmed">Không có thông báo nào</Text>
                </Box>
              )
            : (
                <Stack gap={0}>
                  {notifications.map((notif) => {
                    const typeInfo = TYPE_ICON[notif.type] ?? TYPE_ICON.SYSTEM;
                    const Icon = typeInfo!.icon;
                    return (
                      <Box
                        key={notif.id}
                        px="md"
                        py="sm"
                        bg={notif.isRead ? undefined : 'var(--mantine-color-blue-0)'}
                        style={{
                          cursor: notif.isRead ? 'default' : 'pointer',
                          borderBottom: '1px solid var(--mantine-color-gray-1)',
                          position: 'relative',
                        }}
                        onClick={() => {
                          if (!notif.isRead) {
                            markRead(notif.id);
                          }
                        }}
                      >
                        <Group gap="sm" align="flex-start" wrap="nowrap">
                          <ThemeIcon
                            variant="light"
                            color={typeInfo!.color}
                            size="md"
                            radius="xl"
                            mt={2}
                          >
                            <Icon size={14} />
                          </ThemeIcon>
                          <Box flex={1} miw={0}>
                            <Group gap={4} mb={2} justify="space-between" wrap="nowrap">
                              <Text size="xs" fw={notif.isRead ? 400 : 600} lineClamp={1} flex={1}>
                                {notif.title}
                              </Text>
                              <CloseButton
                                size="xs"
                                variant="subtle"
                                onClick={e => deleteNotification(notif.id, e)}
                                aria-label="Xoá thông báo"
                              />
                            </Group>
                            <Text size="xs" c="dimmed" lineClamp={2}>{notif.message}</Text>
                            <Text size="xs" c="dimmed" mt={2}>{formatTimeAgo(notif.createdAt, now)}</Text>
                          </Box>
                        </Group>
                      </Box>
                    );
                  })}
                </Stack>
              )}
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
}
