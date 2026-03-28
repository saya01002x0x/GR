'use client';

import {
  Box,
  Button,
  Group,
  ScrollArea,
} from '@mantine/core';
import { useState } from 'react';

type Category = {
  id: string;
  label: string;
  active?: boolean;
};

type CategoryPillsProps = {
  categories: Category[];
  onCategoryChange?: (categoryId: string) => void;
};

export function CategoryPills({ categories, onCategoryChange }: CategoryPillsProps) {
  const [activeCategory, setActiveCategory] = useState(
    categories.find(c => c.active)?.id || categories[0]?.id,
  );

  const handleClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  return (
    <Box px={{ base: 'md', md: 'xl' }} pb="md">
      <ScrollArea
        type="never"
        offsetScrollbars={false}
      >
        <Group gap="xs" wrap="nowrap" py="xs">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'filled' : 'default'}
              color={activeCategory === category.id ? 'dark' : 'gray'}
              radius="xl"
              size="sm"
              fw={activeCategory === category.id ? 700 : 500}
              onClick={() => handleClick(category.id)}
              style={{
                flexShrink: 0,
              }}
            >
              {category.label}
            </Button>
          ))}
        </Group>
      </ScrollArea>
    </Box>
  );
}
