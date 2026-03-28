import { Box, Flex } from '@mantine/core';
import { setRequestLocale } from 'next-intl/server';
import { ArtworkGallery, ProfileSidebar } from '@/components/artist';
import { mockArtist } from '@/mocks/artistData';

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
          backgroundImage: `url(${src})`,
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

  // In real app, fetch artist data by username
  // For now, use mock data
  const artist = mockArtist;

  return (
    <>
      {/* Cover Image */}
      <CoverImage src={artist.coverImage} />

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
