'use client';

import {
  Box,
  Button,
  Container,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAdjustmentsHorizontal,
  IconPlayerPause,
  IconPlayerPlay,
  IconSearch,
  IconSparkles,
} from '@tabler/icons-react';
import Link from 'next/link';
import classes from './HeroSection.module.css';

export function HeroSection() {
  const [motionActive, { toggle: toggleMotion }] = useDisclosure(true);

  return (
    <Box component="section" className={classes.hero}>
      <Box className={classes.backgroundWrapper}>
        <Box
          className={classes.parallaxBg}
          style={{
            backgroundImage: 'url(\'https://lh3.googleusercontent.com/aida-public/AB6AXuC6unHvvOy7941Yx76tMVBrIkeXpdpD0vxXw6BYPpVTNxWwvRKqrUU0ikxwZiTfsEFovvQtbUBbkv6LaJgne946-3RiTkpe2bHmldufzKjDdecE-RT4ttoVUJ0HbuCa2bYzmiwC82xTx5vEkml2uMzb3xGL053kvm24_ztz6_P3XzTdT92KCCEIbMP2D2qvilHbncdAz2rYpOz1YFJ_9DeJh8UGxgUHWKEjpOjaEHueu5jXgwQUUr8LGZrnWTBBGEnGe3ChSHGn5WU\')',
            animationPlayState: motionActive ? 'running' : 'paused',
          }}
        />
        <Box className={classes.videoOverlay} />
      </Box>

      <Box className={classes.motionToggle}>
        <Button
          variant="white"
          bg="rgba(255, 255, 255, 0.1)"
          onClick={toggleMotion}
          leftSection={motionActive ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
          radius="xl"
          style={{ backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
          c="white"
          size="xs"
        >
          {motionActive ? 'Motion ON' : 'Motion OFF'}
        </Button>
      </Box>

      <Container size="md" pos="relative" style={{ zIndex: 2 }}>
        <Stack align="center" gap={50} ta="center">
          <Group
            gap="xs"
            px="md"
            py={4}
            style={{
              borderRadius: '9999px',
              backgroundColor: 'rgba(229, 46, 92, 0.2)',
              border: '1px solid rgba(229, 46, 92, 0.3)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <IconSparkles size={14} color="var(--mantine-color-primary-6)" />
            <Text size="xs" fw={700} c="primary" tt="uppercase" lts={1}>
              New Summer Challenge Live
            </Text>
          </Group>

          <Title order={1} className={classes.title}>
            Discover Your Next
            {' '}
            <span className={classes.italic}>Inspiration</span>
          </Title>

          <Text className={classes.description}>
            Join a global community of over 5 million artists and art lovers. Share your vision, find your muse, and grow together in our motion-driven studio.
          </Text>

          <Group gap="md">
            <Button size="xl" radius="md" px={40} className={classes.ctaPrimary} component={Link} href="/discover">
              Join the Community
            </Button>
            <Button
              size="xl"
              radius="md"
              px={40}
              variant="white"
              bg="rgba(255, 255, 255, 0.1)"
              c="white"
              style={{ backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
              className={classes.ctaSecondary}
              component={Link}
              href="/discover"
            >
              Discover Artworks
            </Button>
          </Group>

          <Box className={classes.searchContainer}>
            <Box className={classes.searchGlow} />
            <Group className={classes.searchBar} gap={0} wrap="nowrap">
              <Box px="md" c="dimmed">
                <IconSearch size={24} />
              </Box>
              <TextInput
                placeholder="Search for artists, tags, or styles..."
                variant="unstyled"
                flex={1}
                styles={{
                  input: {
                    fontSize: '1.25rem',
                    fontWeight: 500,
                    height: '100%',
                  },
                }}
              />
              <Button
                variant="subtle"
                color="gray"
                leftSection={<IconAdjustmentsHorizontal size={20} />}
                visibleFrom="md"
                mr="xs"
                fw={700}
              >
                Filters
              </Button>
            </Group>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
