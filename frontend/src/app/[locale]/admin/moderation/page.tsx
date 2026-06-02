'use client';

import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconHistory,
  IconInfoCircle,
  IconShieldOff,
  IconUser,
  IconX,
} from '@tabler/icons-react';
import { useState } from 'react';
import {
  useAdminArtworkReports,
  useAdminFlaggedArtworks,
  useAdminMyHistory,
  useAdminResolvedReports,
} from '@/api/hooks';

const REASON_CONFIG: Record<string, { label: string; color: string }> = {
  SPAM: { label: 'Spam', color: 'orange' },
  NSFW: { label: 'NSFW', color: 'red' },
  COPYRIGHT: { label: 'Bản quyền', color: 'violet' },
  HARASSMENT: { label: 'Quấy rối', color: 'pink' },
  OTHER: { label: 'Khác', color: 'gray' },
};

type ResolvedReport = {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  artwork: {
    id: string;
    title: string;
    status: string;
    images: { thumbnailUrl: string | null; url: string }[];
    author: { id: string; username: string; displayName: string | null };
  } | null;
  reporter: { id: string; username: string; displayName: string | null };
  resolvedBy?: { id: string; username: string; displayName: string | null } | null;
};

function ResolvedReportCard({ report, showResolver }: { report: ResolvedReport; showResolver: boolean }) {
  const cfg = REASON_CONFIG[report.reason] ?? REASON_CONFIG.OTHER;
  const isApproved = report.status === 'DISMISSED';

  return (
    <Paper p="sm" radius="md" withBorder>
      <Group gap="md" align="flex-start" wrap="nowrap">
        {report.artwork && (
          <Image
            src={report.artwork.images[0]?.thumbnailUrl || report.artwork.images[0]?.url}
            w={60}
            h={60}
            radius="sm"
            fit="cover"
            alt={report.artwork.title}
            fallbackSrc="https://placehold.co/60x60?text=?"
          />
        )}
        <Stack gap={4} flex={1} miw={0}>
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm" fw={600} lineClamp={1}>
              {report.artwork?.title ?? '(Image deleted)'}
            </Text>
            <Group gap={4}>
              <Badge color={cfg!.color} variant="light" size="xs">{cfg!.label}</Badge>
              <Badge
                color={isApproved ? 'green' : 'red'}
                variant="filled"
                size="xs"
              >
                {isApproved ? 'Approve' : 'Reject'}
              </Badge>
            </Group>
          </Group>

          <Group gap="xs">
            <Text size="xs" c="dimmed">
              Reporter:
              {' '}
              {report.reporter.displayName || report.reporter.username}
            </Text>
            {report.artwork && (
              <Text size="xs" c="dimmed">
                • Author:
                {' '}
                {report.artwork.author.displayName || report.artwork.author.username}
              </Text>
            )}
          </Group>

          {report.description && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              &quot;
              {report.description}
              &quot;
            </Text>
          )}

          <Group gap="xs">
            {report.resolvedAt && (
              <Text size="xs" c="dimmed">
                Resolved at:
                {' '}
                {new Date(report.resolvedAt).toLocaleString('vi-VN')}
              </Text>
            )}
            {showResolver && report.resolvedBy && (
              <Text size="xs" c="dimmed">
                • By:
                {' '}
                {report.resolvedBy.displayName || report.resolvedBy.username}
              </Text>
            )}
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}

function PendingTab() {
  const { artworks, isLoading, takeAction } = useAdminFlaggedArtworks();
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const { data: detailData, isLoading: detailLoading } = useAdminArtworkReports(selectedArtworkId);

  const openDetail = (artworkId: string) => {
    setSelectedArtworkId(artworkId);
    open();
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const data = await takeAction({ id, action });
      close();

      if (action === 'approve') {
        notifications.show({ message: 'Image approved - reports dismissed', color: 'green' });
      } else {
        const msg = (data as any)?.tempBanned
          ? `Đã ẩn ảnh. Tác giả bị cảnh cáo lần ${(data as any).warningCount} → TẠM KHÓA 7 ngày!`
          : `Đã ẩn ảnh. Tác giả bị cảnh cáo lần ${(data as any)?.warningCount ?? '?'}/3`;
        notifications.show({
          message: msg,
          color: (data as any)?.tempBanned ? 'red' : 'orange',
        });
      }
    } catch {
      notifications.show({ message: 'Action failed', color: 'red' });
    }
  };

  if (isLoading) {
    return (
      <Stack align="center" pt="xl">
        <Loader />
        <Text c="dimmed">Đang tải nội dung cần kiểm duyệt...</Text>
      </Stack>
    );
  }

  return (
    <>
      {artworks.length === 0
        ? (
            <Paper p="xl" radius="md" withBorder ta="center">
              <ThemeIcon size={48} variant="light" color="green" mx="auto" mb="md">
                <IconCheck size={24} />
              </ThemeIcon>
              <Text fw={600}>No content violations</Text>
              <Text size="sm" c="dimmed">The community is very clean!</Text>
            </Paper>
          )
        : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
              {artworks.map((art) => {
                const uniqueReasons = [...new Set(art.reports.map(r => r.reason))];
                return (
                  <Card
                    key={art.id}
                    withBorder
                    radius="md"
                    p="sm"
                    style={{ cursor: 'pointer' }}
                    onClick={() => openDetail(art.id)}
                  >
                    <Card.Section>
                      <Image
                        src={art.images[0]?.thumbnailUrl || art.images[0]?.url}
                        h={200}
                        alt={art.title}
                        fallbackSrc="https://placehold.co/400x300?text=No+Image"
                      />
                    </Card.Section>

                    <Stack gap="xs" mt="sm">
                      <Text fw={600} lineClamp={1}>{art.title}</Text>
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">
                          by
                          {' '}
                          {art.author.displayName || art.author.username}
                        </Text>
                        {art.author.warningCount > 0 && (
                          <Tooltip label={`${art.author.warningCount} warnings still active`}>
                            <Badge size="xs" color="orange" variant="dot">
                              {art.author.warningCount}
                              {' '}
                              warn
                            </Badge>
                          </Tooltip>
                        )}
                      </Group>

                      <Group gap={4} wrap="wrap">
                        {uniqueReasons.map((reason) => {
                          const cfg = REASON_CONFIG[reason] ?? REASON_CONFIG.OTHER;
                          return (
                            <Badge key={reason} size="xs" color={cfg!.color} variant="light">
                              {cfg!.label}
                            </Badge>
                          );
                        })}
                        <Badge size="xs" color="red" variant="filled">
                          {art._count.reports}
                          {' '}
                          reports
                        </Badge>
                      </Group>

                      <Group justify="flex-end" gap="xs" onClick={e => e.stopPropagation()}>
                        <Tooltip label="Approve (keep image visible)">
                          <ActionIcon
                            color="green"
                            variant="light"
                            onClick={() => handleAction(art.id, 'approve')}
                          >
                            <IconCheck size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Reject (hide image + warn author)">
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => handleAction(art.id, 'reject')}
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}

      <Modal
        opened={opened}
        onClose={close}
        title="Report details"
        size="lg"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {detailLoading || !detailData
          ? (
              <Stack align="center" py="xl">
                <Loader />
              </Stack>
            )
          : (
              <Stack gap="md">
                <Group align="flex-start" gap="md">
                  <Image
                    src={detailData.images[0]?.thumbnailUrl || detailData.images[0]?.url}
                    w={120}
                    h={120}
                    radius="md"
                    fit="cover"
                    alt={detailData.title}
                    fallbackSrc="https://placehold.co/120x120?text=No+Image"
                  />
                  <Stack gap={4} flex={1}>
                    <Text fw={700} size="lg">{detailData.title}</Text>
                    <Group gap="xs">
                      <Avatar src={null} size="sm" />
                      <Text size="sm">
                        {detailData.author.displayName || detailData.author.username}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      {detailData.author.isBanned && (
                        <Badge color="red" variant="filled" size="sm" leftSection={<IconShieldOff size={10} />}>
                          Banned
                        </Badge>
                      )}
                      <Badge
                        color={detailData.author.warningCount >= 3 ? 'red' : detailData.author.warningCount > 0 ? 'orange' : 'green'}
                        variant="light"
                        size="sm"
                        leftSection={<IconAlertTriangle size={10} />}
                      >
                        {detailData.author.warningCount}
                        /3 warnings
                      </Badge>
                    </Group>
                  </Stack>
                </Group>

                {detailData.author.warnings && detailData.author.warnings.length > 0 && (
                  <>
                    <Divider label="Active warnings" labelPosition="left" />
                    <Stack gap="xs">
                      {detailData.author.warnings.map(w => (
                        <Paper key={w.id} p="xs" radius="sm" withBorder bg="orange.0">
                          <Group justify="space-between">
                            <Group gap="xs">
                              <IconAlertTriangle size={14} color="orange" />
                              <Text size="xs" fw={500}>{REASON_CONFIG[w.reason]?.label ?? w.reason}</Text>
                            </Group>
                            <Text size="xs" c="dimmed">
                              Expires:
                              {' '}
                              {new Date(w.expiresAt).toLocaleDateString('vi-VN')}
                            </Text>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </>
                )}

                <Divider label={`${detailData.reports.length} reports pending moderation`} labelPosition="left" />

                <Stack gap="sm">
                  {detailData.reports.map((report) => {
                    const cfg = REASON_CONFIG[report.reason] ?? REASON_CONFIG.OTHER;
                    return (
                      <Paper key={report.id} p="sm" radius="md" withBorder>
                        <Group justify="space-between" mb={4}>
                          <Group gap="xs">
                            <IconUser size={14} />
                            <Text size="xs" fw={500}>
                              {report.reporter?.displayName || report.reporter?.username}
                            </Text>
                          </Group>
                          <Badge color={cfg!.color} variant="light" size="sm">
                            {cfg!.label}
                          </Badge>
                        </Group>
                        {report.description && (
                          <Text size="xs" c="dimmed" mt={4}>
                            {report.description}
                          </Text>
                        )}
                        <Text size="xs" c="dimmed" mt={4}>
                          {new Date(report.createdAt).toLocaleString('vi-VN')}
                        </Text>
                      </Paper>
                    );
                  })}
                </Stack>

                <Paper p="sm" radius="md" bg="blue.0" withBorder>
                  <Group gap="xs">
                    <IconInfoCircle size={16} color="blue" />
                    <Text size="xs" c="blue.7">
                      <strong>Approve (✓):</strong>
                      {' '}
                      Image remains visible, all reports dismissed.
                      {' '}
                      <strong>Reject (✗):</strong>
                      {' '}
                      Image hidden + author warned. 3rd warning = temp ban for 7 days.
                    </Text>
                  </Group>
                </Paper>

                <Group justify="flex-end" gap="sm">
                  <Button variant="default" onClick={close}>Close</Button>
                  <Button
                    color="green"
                    leftSection={<IconCheck size={16} />}
                    onClick={() => handleAction(detailData.id, 'approve')}
                  >
                    Approve image
                  </Button>
                  <Button
                    color="red"
                    leftSection={<IconX size={16} />}
                    onClick={() => handleAction(detailData.id, 'reject')}
                  >
                    Reject + Warn
                  </Button>
                </Group>
              </Stack>
            )}
      </Modal>
    </>
  );
}

function ResolvedTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminResolvedReports(page);
  const reports = data?.reports ?? [];
  const total = data?.total ?? 0;

  if (isLoading) {
    return <Stack align="center" pt="xl"><Loader /></Stack>;
  }

  if (reports.length === 0) {
    return (
      <Paper p="xl" radius="md" withBorder ta="center">
        <Text c="dimmed">No reports have been resolved</Text>
      </Paper>
    );
  }

  return (
    <Stack gap="sm">
      {reports.map(report => (
        <ResolvedReportCard key={report.id} report={report} showResolver />
      ))}
      {total > 20 && (
        <Group justify="center" mt="md">
          <Button
            variant="subtle"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Previous
          </Button>
          <Text size="sm" c="dimmed">
            Page
            {' '}
            {page}
            {' '}
            /
            {' '}
            {Math.ceil(total / 20)}
          </Text>
          <Button
            variant="subtle"
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage(p => p + 1)}
          >
            Next →
          </Button>
        </Group>
      )}
    </Stack>
  );
}

function MyHistoryTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminMyHistory(page);
  const reports = data?.reports ?? [];
  const total = data?.total ?? 0;

  if (isLoading) {
    return <Stack align="center" pt="xl"><Loader /></Stack>;
  }

  if (reports.length === 0) {
    return (
      <Paper p="xl" radius="md" withBorder ta="center">
        <Text c="dimmed">You have not resolved any reports</Text>
      </Paper>
    );
  }

  return (
    <Stack gap="sm">
      {reports.map(report => (
        <ResolvedReportCard key={report.id} report={report} showResolver={false} />
      ))}
      {total > 20 && (
        <Group justify="center" mt="md">
          <Button
            variant="subtle"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Previous
          </Button>
          <Text size="sm" c="dimmed">
            Page
            {' '}
            {page}
            {' '}
            /
            {' '}
            {Math.ceil(total / 20)}
          </Text>
          <Button
            variant="subtle"
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage(p => p + 1)}
          >
            Next →
          </Button>
        </Group>
      )}
    </Stack>
  );
}

export default function ModerationPage() {
  return (
    <Stack gap="lg">
      <Title order={2}>Content Moderation</Title>

      <Tabs defaultValue="pending" variant="outline" radius="md">
        <Tabs.List>
          <Tabs.Tab value="pending" leftSection={<IconClock size={16} />}>
            Pending moderation
          </Tabs.Tab>
          <Tabs.Tab value="resolved" leftSection={<IconCheck size={16} />}>
            Resolved
          </Tabs.Tab>
          <Tabs.Tab value="my-history" leftSection={<IconHistory size={16} />}>
            My history
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="pending" pt="md">
          <PendingTab />
        </Tabs.Panel>

        <Tabs.Panel value="resolved" pt="md">
          <ResolvedTab />
        </Tabs.Panel>

        <Tabs.Panel value="my-history" pt="md">
          <MyHistoryTab />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
