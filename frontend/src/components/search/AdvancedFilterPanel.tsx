'use client';

import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Group,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconChevronDown,
  IconFilter,
  IconRectangle,
  IconRectangleVertical,
  IconRulerMeasure,
  IconSortDescending,
  IconSquare,
} from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  POPULAR_TAGS,
  RatingFilter,
  RatioOption,
  RESOLUTION_LABELS,
  ResolutionOption,
  SortOption,
} from './constants';

const INITIAL_TAGS_COUNT = 5;

type AdvancedFilterPanelProps = {
  onFilterChange?: () => void;
};

export function AdvancedFilterPanel({ onFilterChange }: AdvancedFilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const currentTags = searchParams.getAll('tags');
  const currentRating = (searchParams.get('rating') as RatingFilter) || RatingFilter.ALL;
  const excludeAI = searchParams.get('excludeAI') === 'true';
  const currentSort = (searchParams.get('sort') as SortOption) || SortOption.NEWEST;
  const currentRatio = searchParams.get('ratio') || '';
  const currentMinRes = searchParams.get('minRes') || '';

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

  const toggleTag = (tag: string) => {
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateParams({ tags: newTags.length > 0 ? newTags : null });
  };

  const handleRatingChange = (rating: RatingFilter) => {
    updateParams({ rating: rating === RatingFilter.ALL ? null : rating });
  };

  const handleExcludeAIChange = (checked: boolean) => {
    updateParams({ excludeAI: checked ? 'true' : null });
  };

  const handleSortChange = (sort: string | null) => {
    updateParams({ sort: sort === SortOption.NEWEST ? null : sort });
  };

  const handleRatioChange = (val: string) => {
    updateParams({ ratio: val === currentRatio ? null : val || null });
  };

  const handleResolutionChange = (val: string) => {
    updateParams({ minRes: val === currentMinRes ? null : val || null });
  };

  const initialTags = POPULAR_TAGS.slice(0, INITIAL_TAGS_COUNT);
  const extraTags = POPULAR_TAGS.slice(INITIAL_TAGS_COUNT);

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        {/* Popular Tags - collapsible */}
        <Box>
          <Group gap="xs" mb="xs">
            <IconFilter size={16} />
            <Text size="sm" fw={500}>
              Popular Tags
            </Text>
          </Group>
          <Group gap="xs">
            {initialTags.map(tag => (
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
          {extraTags.length > 0 && (
            <>
              <Collapse in={tagsExpanded}>
                <Group gap="xs" mt="xs">
                  {extraTags.map(tag => (
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
              </Collapse>
              <Button
                variant="subtle"
                size="compact-xs"
                mt={6}
                onClick={() => setTagsExpanded(v => !v)}
                rightSection={(
                  <IconChevronDown
                    size={14}
                    style={{
                      transform: tagsExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 200ms ease',
                    }}
                  />
                )}
              >
                {tagsExpanded ? 'Show less' : 'Show more'}
              </Button>
            </>
          )}
        </Box>

        <Divider />

        {/* Ratio & Size */}
        <Box>
          <Group gap="xs" mb="xs">
            <IconRulerMeasure size={16} />
            <Text size="sm" fw={500}>
              Ratio & Size
            </Text>
          </Group>
          <Group gap="xs">
            <Tooltip label="Portrait (vertical)">
              <Chip
                checked={currentRatio === RatioOption.PORTRAIT}
                onChange={() => handleRatioChange(RatioOption.PORTRAIT)}
                size="sm"
                variant="outline"
              >
                <Group gap={4} wrap="nowrap">
                  <IconRectangleVertical size={14} />
                  <span>Portrait</span>
                </Group>
              </Chip>
            </Tooltip>
            <Tooltip label="Landscape (horizontal)">
              <Chip
                checked={currentRatio === RatioOption.LANDSCAPE}
                onChange={() => handleRatioChange(RatioOption.LANDSCAPE)}
                size="sm"
                variant="outline"
              >
                <Group gap={4} wrap="nowrap">
                  <IconRectangle size={14} />
                  <span>Landscape</span>
                </Group>
              </Chip>
            </Tooltip>
            <Tooltip label="Square (1:1)">
              <Chip
                checked={currentRatio === RatioOption.SQUARE}
                onChange={() => handleRatioChange(RatioOption.SQUARE)}
                size="sm"
                variant="outline"
              >
                <Group gap={4} wrap="nowrap">
                  <IconSquare size={14} />
                  <span>Square</span>
                </Group>
              </Chip>
            </Tooltip>
          </Group>

          <Text size="sm" fw={500} mt="sm" mb="xs">
            Min Resolution
          </Text>
          <Group gap="xs">
            {Object.values(ResolutionOption).map(res => (
              <Chip
                key={res}
                checked={currentMinRes === res}
                onChange={() => handleResolutionChange(res)}
                size="sm"
                variant="outline"
              >
                {RESOLUTION_LABELS[res]}
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
