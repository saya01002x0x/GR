'use client';

import {
  Anchor,
  Box,
  Group,
  SimpleGrid,
  Tabs,
  Title,
} from '@mantine/core';
import { ArtworkCard } from '@/components/artwork';

type RankingTab = {
  id: string;
  label: string;
};

type RankingSectionProps = {
  tabs: RankingTab[];
  artworks: any[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function RankingSection({ tabs, artworks, activeTab, onTabChange }: RankingSectionProps) {
  return (
    <Box mb="xl">
      {/* Header */}
      <Group justify="space-between" mb="md">
        <Title order={3}>Ranking</Title>
        <Anchor href="#" size="sm" fw={700} c="primary">
          View All
        </Anchor>
      </Group>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={value => onTabChange(value || tabs[0]?.id || '')}
        variant="unstyled"
        mb="lg"
      >
        <Tabs.List
          style={{
            borderBottom: '1px solid var(--mantine-color-gray-2)',
            gap: 'var(--mantine-spacing-xl)',
          }}
        >
          {tabs.map(tab => (
            <Tabs.Tab
              key={tab.id}
              value={tab.id}
              pb="sm"
              fw={700}
              fz="sm"
              c={activeTab === tab.id ? undefined : 'dimmed'}
              style={{
                borderBottom: activeTab === tab.id
                  ? '3px solid var(--mantine-color-dark-9)'
                  : '3px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      {/* Grid */}
      <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5, lg: 6 }} spacing="sm">
        {artworks.map(artwork => (
          <ArtworkCard
            key={artwork.id}
            title={artwork.title}
            image={artwork.image}
            artist={artwork.artist}
            rank={artwork.rank}
            size="sm"
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}
