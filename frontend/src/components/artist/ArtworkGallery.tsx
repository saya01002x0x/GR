'use client';

import type { PublicArtistDetail } from './ProfileSidebar';
import {
  Box,
  Button,
  Group,
  Loader,
  NativeSelect,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { useState } from 'react';
import { useArtistArtworks } from '@/api/hooks/use-artist-artworks';
import { ArtworkCard } from './ArtworkCard';
import { MembershipTab } from './MembershipTab';

type ArtworkGalleryProps = {
  artist: PublicArtistDetail;
};

export function ArtworkGallery({ artist }: ArtworkGalleryProps) {
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [premiumTierFilter, setPremiumTierFilter] = useState<string>('all');

  // Determine the API filter based on active tab
  const apiFilter
    = activeTab === 'all'
      ? undefined
      : activeTab === 'premium'
        ? premiumTierFilter === 'all'
          ? 'premium'
          : premiumTierFilter // specific tier ID
        : activeTab || undefined;

  const { artworks, hasMore, isLoading, isLoadingMore, loadMore } = useArtistArtworks(
    artist.username,
    activeTab === 'membership' ? undefined : apiFilter,
  );

  // Calculate premium artwork count (sum of all tier counts for accessible tiers)
  const premiumCount = artist.accessibleTierIds.reduce(
    (sum, tierId) => sum + (artist.artworkCounts.tiers[tierId] || 0),
    0,
  );

  // Accessible tiers for the premium dropdown filter
  const accessibleTiers = artist.tiers.filter((t: any) =>
    artist.accessibleTierIds.includes(t.id),
  );

  // Build tabs
  const tabs: { value: string; label: string; count: number | null }[] = [
    { value: 'all', label: 'All Artworks', count: artist.artworkCounts.all },
    { value: 'free', label: 'Free', count: artist.artworkCounts.free },
    // 💎 Premium: only show if user has subscribed to at least 1 tier
    ...(artist.accessibleTierIds.length > 0
      ? [{ value: 'premium', label: '💎 Premium', count: premiumCount }]
      : []),
    // ⭐ Membership: only show if NOT owner AND artist has tiers
    ...(!artist.isOwner && artist.tiers.length > 0
      ? [{ value: 'membership', label: 'Membership', count: null }]
      : []),
  ].filter(t => t.count === null || t.count > 0 || t.value === 'all');

  return (
    <Stack gap="lg" flex={1} maw="100%" pt={{ base: 'xs', lg: 'xl' }}>
      {/* Navigation Tabs */}
      <Box
        pos="sticky"
        top={64}
        bg="var(--mantine-color-body)"
        style={{
          zIndex: 30,
          backdropFilter: 'blur(8px)',
        }}
        pt="xs"
        pb="sm"
      >
        <Tabs
          value={activeTab}
          onChange={(val) => {
            setActiveTab(val);
            setPremiumTierFilter('all');
          }}
          variant="unstyled"
        >
          <Tabs.List
            style={{
              borderBottom: '1px solid var(--mantine-color-gray-2)',
              gap: 0,
              flexWrap: 'nowrap',
              overflowX: 'auto',
            }}
          >
            {tabs.map(category => (
              <Tabs.Tab
                key={category.value}
                value={category.value}
                px="md"
                py="sm"
                fw={activeTab === category.value ? 700 : 500}
                c={activeTab === category.value ? 'primary' : 'dimmed'}
                style={{
                  borderBottom: activeTab === category.value
                    ? '2px solid var(--mantine-color-primary-6)'
                    : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                {category.label}
                {category.count != null && category.count > 0 && (
                  <Text component="span" size="xs" c="dimmed" ml={4} fw={400}>
                    {category.count}
                  </Text>
                )}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 'membership'
        ? (
          // Membership Tab — tier showcase
            <MembershipTab artistUsername={artist.username} />
          )
        : (
            <>
              {/* Premium Tab — tier dropdown filter */}
              {activeTab === 'premium' && accessibleTiers.length > 1 && (
                <Group>
                  <NativeSelect
                    size="sm"
                    value={premiumTierFilter}
                    onChange={e => setPremiumTierFilter(e.currentTarget.value)}
                    data={[
                      { value: 'all', label: 'All Tiers' },
                      ...accessibleTiers.map((t: any) => ({
                        value: t.id,
                        label: t.name,
                      })),
                    ]}
                    style={{ minWidth: 160 }}
                  />
                </Group>
              )}

              {/* Masonry Gallery */}
              {isLoading
                ? (
                    <Group justify="center" p="xl">
                      <Loader />
                    </Group>
                  )
                : artworks.length === 0
                  ? (
                      <Group justify="center" p="xl">
                        <Text c="dimmed">No artworks found in this category.</Text>
                      </Group>
                    )
                  : (
                      <Box className="masonry-grid">
                        {artworks.map(artwork => (
                          <ArtworkCard key={artwork.id} artwork={artwork} />
                        ))}
                      </Box>
                    )}

              {/* Load More Button */}
              {hasMore && (
                <Group justify="center" mt="xl">
                  <Button
                    variant="default"
                    radius="xl"
                    size="md"
                    onClick={loadMore}
                    loading={isLoadingMore}
                  >
                    Load more artworks
                  </Button>
                </Group>
              )}
            </>
          )}
    </Stack>
  );
}
