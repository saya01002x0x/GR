'use client';

import { Box, Flex } from '@mantine/core';
import {
  ArtworkActions,
  ArtworkImage,
  ArtworkSidebar,
  CommentsSection,
  RelatedArtworks,
} from '@/components/artwork-detail';
import {
  mockArtworkDetail,
  mockComments,
  mockRelatedArtworks,
} from '@/mocks/artworkDetailData';

export default function ArtworkDetailPage() {
  const artwork = mockArtworkDetail;
  const comments = mockComments;
  const relatedArtworks = mockRelatedArtworks;

  return (
    <Box maw={1400} mx="auto" px={{ base: 'md', md: 'xl' }} py="xl">
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        gap="xl"
      >
        {/* Left Column - Main Content */}
        <Box flex={1} miw={0}>
          {/* Artwork Image */}
          <ArtworkImage
            src={artwork.image}
            alt={artwork.title}
          />

          {/* Action Bar */}
          <ArtworkActions likes={artwork.likes} />

          {/* Comments Section */}
          <CommentsSection
            comments={comments}
            totalCount={42}
          />
        </Box>

        {/* Right Column - Sidebar (Sticky only during image/comments) */}
        <ArtworkSidebar artwork={artwork} />
      </Flex>

      {/* Related Artworks - full width, sidebar not sticky here */}
      <RelatedArtworks artworks={relatedArtworks} />
    </Box>
  );
}
