'use client';

import type { TierPreview } from '@/api/hooks/use-tier-previews';
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Image,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconCheck,
  IconCrown,
  IconLock,
  IconPhoto,
  IconUsers,
} from '@tabler/icons-react';
import { useSubscribeToTier } from '@/api/hooks/use-payments';
import { useArtistTierPreviews } from '@/api/hooks/use-tier-previews';

type MembershipTabProps = {
  artistUsername: string;
};

/**
 * Membership Tab — Tier showcase with blurred artwork previews
 * Shows all tiers of the artist with subscription CTA
 */
export function MembershipTab({ artistUsername }: MembershipTabProps) {
  const { tierPreviews, isLoading, error } = useArtistTierPreviews(artistUsername);
  const subscribeMutation = useSubscribeToTier();

  const handleSubscribe = (tierId: string) => {
    subscribeMutation.mutate(
      { tierId },
      {
        onSuccess: (data) => {
          // Redirect to checkout URL
          if (data?.data?.checkoutUrl) {
            window.location.href = data.data.checkoutUrl;
          }
        },
      },
    );
  };

  if (isLoading) {
    return (
      <Group justify="center" p="xl">
        <Loader />
      </Group>
    );
  }

  if (error || tierPreviews.length === 0) {
    return (
      <Group justify="center" p="xl">
        <Text c="dimmed">No membership tiers available.</Text>
      </Group>
    );
  }

  return (
    <Stack gap="xl">
      {tierPreviews.map((preview, index) => (
        <TierCard
          key={preview.tier.id}
          preview={preview}
          index={index}
          onSubscribe={handleSubscribe}
          isSubscribing={subscribeMutation.isPending}
        />
      ))}
    </Stack>
  );
}

/* ─────── Tier Card ─────── */

const TIER_COLORS = ['teal', 'violet', 'orange', 'pink', 'cyan', 'indigo'];
const TIER_ICONS = ['🥉', '🥈', '🥇', '💎', '👑', '⭐'];

function TierCard({
  preview,
  index,
  onSubscribe,
  isSubscribing,
}: {
  preview: TierPreview;
  index: number;
  onSubscribe: (tierId: string) => void;
  isSubscribing: boolean;
}) {
  const { tier, isSubscribed, totalArtworks, previewArtworks } = preview;
  const color = TIER_COLORS[index % TIER_COLORS.length] ?? 'teal';
  const icon = TIER_ICONS[index % TIER_ICONS.length] ?? '$';

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: tier.currency || 'VND',
    maximumFractionDigits: 0,
  }).format(tier.price);

  return (
    <Card
      radius="lg"
      p={0}
      withBorder
      style={{
        overflow: 'hidden',
        borderColor: isSubscribed
          ? `var(--mantine-color-${color}-4)`
          : undefined,
        transition: 'border-color 0.3s ease',
      }}
    >
      {/* Header */}
      <Box
        p="lg"
        style={{
          background: isSubscribed
            ? `linear-gradient(135deg, var(--mantine-color-${color}-6), var(--mantine-color-${color}-8))`
            : `linear-gradient(135deg, var(--mantine-color-${color}-filled), var(--mantine-color-${color}-9))`,
        }}
      >
        <Group justify="space-between" align="flex-start">
          <Group gap="sm">
            <Text fz={28}>{icon}</Text>
            <Stack gap={2}>
              <Text fw={700} fz="lg" c="white">
                {tier.name}
              </Text>
              <Text fz="sm" c="rgba(255,255,255,0.75)">
                {formattedPrice}
                /tháng
              </Text>
            </Stack>
          </Group>

          {isSubscribed
            ? (
                <Badge
                  variant="white"
                  color={color}
                  size="lg"
                  leftSection={<IconCheck size={14} />}
                >
                  Subscribed
                </Badge>
              )
            : (
                <Button
                  variant="white"
                  color={color}
                  radius="xl"
                  size="sm"
                  leftSection={<IconCrown size={16} />}
                  onClick={() => onSubscribe(tier.id)}
                  loading={isSubscribing}
                >
                  Subscribe
                </Button>
              )}
        </Group>
      </Box>

      {/* Content */}
      <Box p="lg">
        {/* Description */}
        {tier.description && (
          <Text c="dimmed" fz="sm" mb="md" lineClamp={3}>
            {tier.description}
          </Text>
        )}

        {/* Benefits */}
        {tier.benefits && tier.benefits.length > 0 && (
          <Stack gap={6} mb="md">
            {tier.benefits.map((benefit: string) => (
              <Group key={benefit} gap="xs" wrap="nowrap">
                <ThemeIcon
                  size="xs"
                  radius="xl"
                  color={color}
                  variant="light"
                >
                  <IconCheck size={10} />
                </ThemeIcon>
                <Text fz="sm">{benefit}</Text>
              </Group>
            ))}
          </Stack>
        )}

        {/* Stats */}
        <Group gap="lg" mb="md">
          <Group gap={4}>
            <IconUsers size={14} color="var(--mantine-color-dimmed)" />
            <Text fz="xs" c="dimmed">
              {tier.memberCount}
              {' '}
              members
            </Text>
          </Group>
          <Group gap={4}>
            <IconPhoto size={14} color="var(--mantine-color-dimmed)" />
            <Text fz="xs" c="dimmed">
              {totalArtworks}
              {' '}
              artworks
            </Text>
          </Group>
        </Group>

        {/* Blurred Preview Grid — only for unsubscribed tiers */}
        {!isSubscribed && previewArtworks.length > 0 && (
          <SimpleGrid cols={{ base: 3, sm: 4, md: 6 }} spacing="xs">
            {previewArtworks.map(artwork => (
              <BlurredPreviewCard
                key={artwork.id}
                artwork={artwork}
                color={color}
              />
            ))}
          </SimpleGrid>
        )}

        {/* Subscribed message */}
        {isSubscribed && (
          <Box
            p="sm"
            style={{
              borderRadius: 'var(--mantine-radius-md)',
              backgroundColor: `var(--mantine-color-${color}-0)`,
              border: `1px solid var(--mantine-color-${color}-2)`,
            }}
          >
            <Text fz="sm" c={color} ta="center">
              ✓ You have access to all content in this tier. Check the
              {' '}
              <Text component="span" fw={600}>
                💎 Premium
              </Text>
              {' '}
              tab to browse.
            </Text>
          </Box>
        )}
      </Box>
    </Card>
  );
}

/* ─────── Blurred Preview Card ─────── */

function BlurredPreviewCard({
  artwork,
  color,
}: {
  artwork: { id: string; blurredUrl: string | null; aspectRatio: number };
  color: string;
}) {
  const imageUrl = artwork.blurredUrl;
  const needsCSSBlur = !artwork.blurredUrl;

  return (
    <Box
      pos="relative"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        overflow: 'hidden',
        aspectRatio: '1',
      }}
    >
      {imageUrl
        ? (
            <Image
              src={imageUrl}
              alt="Tier preview"
              w="100%"
              h="100%"
              style={{
                objectFit: 'cover',
                ...(needsCSSBlur
                  ? { filter: 'blur(20px)', transform: 'scale(1.1)' }
                  : {}),
              }}
            />
          )
        : (
            <Box
              w="100%"
              h="100%"
              style={{
                backgroundColor: `var(--mantine-color-${color}-1)`,
              }}
            />
          )}

      {/* Lock overlay */}
      <Box
        pos="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <ThemeIcon
          size="lg"
          radius="xl"
          color="dark"
          variant="filled"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <IconLock size={16} color="white" />
        </ThemeIcon>
      </Box>
    </Box>
  );
}
