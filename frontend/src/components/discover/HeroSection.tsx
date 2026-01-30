'use client';

import type { FeaturedItem } from '@/mocks/discoverData';
import {
  Badge,
  Box,
  Flex,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useHover } from '@mantine/hooks';

type HeroSectionProps = {
  items: FeaturedItem[];
};

type HeroCardProps = {
  item: FeaturedItem;
  isMain?: boolean;
};

function HeroCard({ item, isMain = false }: HeroCardProps) {
  const { hovered, ref } = useHover();

  return (
    <Box
      ref={ref}
      pos="relative"
      h="100%"
      mih={isMain ? 300 : 140}
      style={{
        borderRadius: 'var(--mantine-radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Background Image */}
      <Box
        pos="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{
          backgroundImage: `url(${item.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'transform 0.7s ease',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
        }}
      />

      {/* Gradient Overlay */}
      <Box
        pos="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{
          background: isMain
            ? 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2), transparent)'
            : 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        }}
      />

      {/* Content */}
      <Box
        pos="absolute"
        bottom={0}
        left={0}
        p={isMain ? { base: 'lg', md: 'xl' } : 'md'}
      >
        <Badge
          color={item.tag.color === 'primary' ? 'primary' : item.tag.color}
          variant="filled"
          size={isMain ? 'sm' : 'xs'}
          tt="uppercase"
          fw={700}
          mb="xs"
        >
          {item.tag.label}
        </Badge>

        <Title
          order={isMain ? 2 : 4}
          c="white"
          fw={800}
          lh={1.2}
          mb={isMain ? 'xs' : 0}
        >
          {item.title}
        </Title>

        {isMain && item.subtitle && (
          <Text c="gray.3" size="sm" maw={400} lineClamp={2}>
            {item.subtitle}
          </Text>
        )}
      </Box>
    </Box>
  );
}

export function HeroSection({ items }: HeroSectionProps) {
  const [mainItem, ...sideItems] = items;

  return (
    <Box py="xl" px={{ base: 'md', md: 'xl' }}>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap="md"
        h={{ base: 'auto', md: 400 }}
      >
        {/* Main Featured */}
        <Box flex={2} h={{ base: 300, md: '100%' }}>
          {mainItem && <HeroCard item={mainItem} isMain />}
        </Box>

        {/* Side Items */}
        <Stack flex={1} gap="md" h={{ base: 'auto', md: '100%' }}>
          {sideItems.map(item => (
            <Box key={item.id} flex={1} mih={140}>
              <HeroCard item={item} />
            </Box>
          ))}
        </Stack>
      </Flex>
    </Box>
  );
}
