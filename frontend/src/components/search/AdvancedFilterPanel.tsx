'use client';

import {
  Box,
  Chip,
  Divider,
  Group,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import { IconFilter, IconSortDescending } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { POPULAR_TAGS, RatingFilter, SortOption } from './constants';

type AdvancedFilterPanelProps = {
  onFilterChange?: () => void;
};

export function AdvancedFilterPanel({ onFilterChange }: AdvancedFilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read current filters from URL
  const currentTags = searchParams.getAll('tags');
  const currentRating = (searchParams.get('rating') as RatingFilter) || RatingFilter.ALL;
  const excludeAI = searchParams.get('excludeAI') === 'true';
  const currentSort = (searchParams.get('sort') as SortOption) || SortOption.NEWEST;

  // Helper to update URL params
  const updateParams = (updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.delete(key);
        value.forEach(v => params.append(key, v));
      } else {
        params.set(key, value);
      }
    });

    router.push(`/search?${params.toString()}`, { scroll: false });
    onFilterChange?.();
  };

  // Toggle tag
  const toggleTag = (tag: string) => {
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateParams({ tags: newTags.length > 0 ? newTags : null });
  };

  // Change rating
  const handleRatingChange = (rating: RatingFilter) => {
    updateParams({ rating: rating === RatingFilter.ALL ? null : rating });
  };

  // Toggle AI exclusion
  const handleExcludeAIChange = (checked: boolean) => {
    updateParams({ excludeAI: checked ? 'true' : null });
  };

  // Change sort
  const handleSortChange = (sort: string | null) => {
    updateParams({ sort: sort === SortOption.NEWEST ? null : sort });
  };

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        {/* Tags */}
        <Box>
          <Group gap="xs" mb="xs">
            <IconFilter size={16} />
            <Text size="sm" fw={500}>
              Popular Tags
            </Text>
          </Group>
          <Group gap="xs">
            {POPULAR_TAGS.map(tag => (
              <Chip
                key={tag}
                checked={currentTags.includes(tag)}
                onChange={() => toggleTag(tag)}
                size="sm"
                radius="sm"
              >
                {tag}
              </Chip>
            ))}
          </Group>
        </Box>

        <Divider />

        {/* Rating Filter */}
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Content Rating
          </Text>
          <Group gap="xs">
            {Object.values(RatingFilter).map(rating => (
              <Chip
                key={rating}
                checked={currentRating === rating}
                onChange={() => handleRatingChange(rating)}
                size="sm"
                variant="outline"
              >
                {rating === 'ALL' ? 'All' : rating}
              </Chip>
            ))}
          </Group>
        </Box>

        <Divider />

        {/* AI Toggle */}
        <Group justify="space-between">
          <Text size="sm">Exclude AI-generated art</Text>
          <Switch
            checked={excludeAI}
            onChange={e => handleExcludeAIChange(e.currentTarget.checked)}
            size="sm"
          />
        </Group>

        <Divider />

        {/* Sort */}
        <Box>
          <Group gap="xs" mb="xs">
            <IconSortDescending size={16} />
            <Text size="sm" fw={500}>
              Sort By
            </Text>
          </Group>
          <Select
            value={currentSort}
            onChange={handleSortChange}
            data={[
              { value: SortOption.NEWEST, label: 'Newest First' },
              { value: SortOption.POPULAR, label: 'Most Popular' },
            ]}
            size="sm"
            radius="md"
          />
        </Box>
      </Stack>
    </Paper>
  );
}
