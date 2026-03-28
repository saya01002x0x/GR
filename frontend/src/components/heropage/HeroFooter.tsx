'use client';

import {
  ActionIcon,
  Anchor,
  Box,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { IconMail, IconShare } from '@tabler/icons-react';

// Logo SVG component
function LogoIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"
        fill="currentColor"
      />
    </svg>
  );
}

const footerLinks = [
  {
    title: 'Explore',
    links: [
      { label: 'Daily Rankings', href: '#' },
      { label: 'Newest Artworks', href: '#' },
      { label: 'Contests', href: '#' },
      { label: 'Featured Artists', href: '#' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Guidelines', href: '#' },
      { label: 'Discussion Boards', href: '#' },
      { label: 'Events', href: '#' },
      { label: 'Creator Hub', href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Contact Us', href: '#' },
    ],
  },
];

export function HeroFooter() {
  return (
    <Box
      component="footer"
      bg="var(--mantine-color-gray-0)"
      className="dark:bg-zinc-950"
      py={60}
      style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
    >
      <Container size="xl">
        <SimpleGrid cols={{ base: 1, md: 4 }} spacing={40}>
          <Stack gap="xl">
            <Group gap="xs">
              <Box c="primary">
                <LogoIcon size={24} />
              </Box>
              <Text fw={800} size="lg">ArtPulse</Text>
            </Group>
            <Text size="sm" c="zinc.5" lh={1.6}>
              The world's largest creative community for artists and art enthusiasts.
            </Text>
            <Group gap="md">
              <ActionIcon variant="default" radius="md" size="lg">
                <IconShare size={18} />
              </ActionIcon>
              <ActionIcon variant="default" radius="md" size="lg">
                <IconMail size={18} />
              </ActionIcon>
            </Group>
          </Stack>

          {footerLinks.map(section => (
            <Stack key={section.title} gap="xl">
              <Text fw={700}>{section.title}</Text>
              <Stack gap="md">
                {section.links.map(link => (
                  <Anchor
                    key={link.label}
                    href={link.href}
                    size="sm"
                    c="dimmed"
                    underline="hover"
                    fw={500}
                  >
                    {link.label}
                  </Anchor>
                ))}
              </Stack>
            </Stack>
          ))}
        </SimpleGrid>

        <Box
          mt={60}
          pt={32}
          style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
          ta="center"
        >
          <Text size="sm" c="dimmed" fw={500}>
            © 2024 ArtPulse Community. All rights reserved.
          </Text>
        </Box>
      </Container>
    </Box>
  );
}
