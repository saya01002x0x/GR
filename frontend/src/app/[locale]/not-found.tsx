'use client';

import {
  Box,
  Button,
  Center,
  Group,
  Image,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  IconHome,
  IconSearch,
  IconTrendingUp,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    if (query?.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <Center mih="calc(100vh - 160px)">
      <Stack align="center" gap="lg" maw={500} px="md">
        {/* Hero Illustration */}
        <Box
          pos="relative"
          w={200}
          h={200}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Animated Background */}
          <Box
            pos="absolute"
            w="100%"
            h="100%"
            className="pulse-animation"
            style={{
              borderRadius: '50%',
              background: 'var(--mantine-color-primary-1)',
            }}
          />
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnKCaW7fWW7D_MYbp7M_FUnZCIHT1xKr6L8s4QRLXOc_qPdGkfZ2wfVwpU9_HCJQgKfAZwTtIy_mQkGb64Gq1Eo2ywmEuTJTowNLXQ4njILDhm8cscexhSQUbwcz5kOeSEE4cH9MnxP7-1v8T_iSdw2r-DDQNW2wPZ5z8WwECgmUyO5pDyc4h_G7vc6IuFaIAZDSFAsDU4nWqiS-jXRMN6K-LCeBT35WpBbgKvxKYy4qrpKJpkFLCy-_qvQJnYWUMJPfH_F8B3xpU"
            alt="Confused artist"
            w={160}
            h={160}
            radius="md"
            style={{
              position: 'relative',
              zIndex: 1,
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))',
            }}
          />
        </Box>

        {/* 404 Number */}
        <Title
          fz={{ base: '5rem', sm: '8rem' }}
          fw={800}
          c="primary"
          lh={1}
          style={{ letterSpacing: '-0.05em' }}
        >
          404
        </Title>

        {/* Heading */}
        <Title order={2} ta="center" fw={700}>
          Whoops! This canvas is blank.
        </Title>

        {/* Description */}
        <Text c="dimmed" ta="center" size="md" maw={400}>
          The masterpiece you&apos;re looking for might have been moved, deleted, or is still being sketched. Let&apos;s find you some inspiration instead.
        </Text>

        {/* Search Bar */}
        <Box w="100%" maw={400} component="form" onSubmit={handleSearch}>
          <TextInput
            name="search"
            placeholder="Search for artists, tags, or works..."
            size="md"
            radius="xl"
            leftSection={<IconSearch size={18} />}
          />
        </Box>

        {/* Action Buttons */}
        <Group gap="md" justify="center" wrap="wrap">
          <Button
            size="md"
            radius="md"
            leftSection={<IconHome size={18} />}
            onClick={() => router.push('/')}
          >
            Return to Home
          </Button>
          <Button
            size="md"
            radius="md"
            variant="default"
            leftSection={<IconTrendingUp size={18} color="var(--mantine-color-primary-6)" />}
            onClick={() => router.push('/discover')}
          >
            Explore Trending
          </Button>
        </Group>
      </Stack>
    </Center>
  );
}
