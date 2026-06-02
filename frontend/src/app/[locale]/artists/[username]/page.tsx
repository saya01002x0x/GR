import { auth } from '@clerk/nextjs/server';
import { Box, Flex, Text } from '@mantine/core';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArtworkGallery, ProfileSidebar } from '@/components/artist';

// Cover Image Component
function CoverImage({ src }: { src: string }) {
  return (
    <Box
      w="100%"
      h={{ base: 240, md: 320 }}
      pos="relative"
      style={{
        overflow: 'hidden',
        backgroundColor: 'var(--mantine-color-gray-1)',
      }}
    >
      <Box
        pos="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{
          backgroundImage: src ? `url(${src})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Box
        pos="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
          opacity: 0.6,
        }}
      />
    </Box>
  );
}

export default async function ArtistProfilePage(props: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username: _username } = await props.params;
  setRequestLocale(locale);

  const { getToken } = await auth();
  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

  const res = await fetch(`${apiUrl}/users/artists/${_username}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store', // Always fetch latest profile data
  });

  if (!res.ok) {
    if (res.status === 404) {
      return notFound();
    }
    return <Text c="red" p="xl">Failed to load artist profile</Text>;
  }

  const { data: artist } = await res.json();

  return (
    <>
      {/* Cover Image */}
      <CoverImage src={artist.banner} />

      {/* Main Content */}
      <Box px={{ base: 'md', md: 'xl' }}>
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          gap="xl"
          pos="relative"
        >
          {/* Left Sidebar: Profile Identity */}
          <Box
            mt={-64}
            pos="relative"
            style={{ zIndex: 10 }}
          >
            <ProfileSidebar artist={artist} />
          </Box>

          {/* Right Content: Portfolio */}
          <ArtworkGallery artist={artist} />
        </Flex>
      </Box>
    </>
  );
}
