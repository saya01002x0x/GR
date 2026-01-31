'use client';

import { Badge, Box, Flex, Text, Title } from '@mantine/core';
import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react';

type AuthPageLayoutProps = {
  children: React.ReactNode;
};

// Static hero image from HTML template
const HERO_IMAGE_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuByGsJnPN9ye0jOscSxW63RwKyM_1zHhikzzTZ4g9sI2e8yxsvzRgd_dZ5pyzo8-FEbQRFeI5M2gFj1I6I126o7CqJLthUJL8mQmfO0lhqKR2L0yWtr-8X8AUKb8vL3uH8GdqwdJA7SEudSb1nX0s35gCGyISsauD548TqxK5VSN5LZ7MskO2earI7BC32HvY_ippzrLnhRM-AKFSxjVZSTTKrOIALC6nMNW6vd4mj1UmwVCRAf9D60eZ-rNJuA7pz9tzOxac16AbM';

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <Flex
      mih="calc(100vh - 64px)"
      direction={{ base: 'column', lg: 'row' }}
    >
      {/* Left Side: Artwork Hero (hidden on mobile) */}
      <Box
        display={{ base: 'none', lg: 'block' }}
        w={{ lg: '50%', xl: '58%' }}
        pos="relative"
        style={{
          backgroundImage: `url(${HERO_IMAGE_URL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Gradient Overlay */}
        <Box
          pos="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)',
          }}
        />

        {/* Art Credit */}
        <Box
          pos="absolute"
          bottom={32}
          left={32}
          right={32}
          style={{ zIndex: 10 }}
        >
          <Badge
            variant="light"
            color="gray"
            size="sm"
            leftSection={<IconRosetteDiscountCheckFilled size={14} />}
            mb="md"
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Featured Artist
          </Badge>
          <Title order={2} c="white" mb={4}>
            Neon Dreams Vol. 4
          </Title>
          <Text c="gray.4" size="sm">
            by
            {' '}
            <Text
              component="span"
              c="white"
              fw={500}
              style={{ cursor: 'pointer' }}
            >
              Alexandra Voke
            </Text>
          </Text>
        </Box>
      </Box>

      {/* Right Side: Auth Form */}
      <Flex
        flex={1}
        direction="column"
        justify="center"
        align="center"
        bg="white"
        p={{ base: 'md', md: 'xl' }}
        style={{ overflow: 'auto' }}
      >
        <Box w="100%" maw={420}>
          {children}
        </Box>

        {/* Mobile Bottom Gradient Accent */}
        <Box
          display={{ base: 'block', lg: 'none' }}
          pos="fixed"
          bottom={0}
          left={0}
          right={0}
          h={8}
          style={{
            background: 'linear-gradient(to right, var(--mantine-color-primary-6), #ff8fa3, var(--mantine-color-primary-6))',
          }}
        />
      </Flex>
    </Flex>
  );
}
