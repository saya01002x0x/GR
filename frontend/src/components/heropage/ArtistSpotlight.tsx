'use client';

import {
  Avatar,
  Box,
  Container,
  Flex,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useFeaturedArtists } from '@/api/hooks';
import classes from './ArtistSpotlight.module.css';

export function ArtistSpotlight() {
  const { data: artists = [] } = useFeaturedArtists();

  return (
    <Container size="xl" pb={120}>
      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={2} fw={800} lts={-0.5}>
            Artist Spotlight
          </Title>
          <Text c="dimmed" fw={500}>
            Meet the creators behind the magic
          </Text>
        </Stack>

        <Flex gap={40} justify={{ base: 'center', md: 'flex-start' }} wrap="wrap">
          {artists.map(artist => (
            <Stack key={artist.id} align="center" gap="sm">
              <Box
                p={2}
                style={{
                  borderRadius: '50%',
                  border: '2px solid transparent',
                  transition: 'border-color 0.2s ease',
                  cursor: 'pointer',
                }}
                className={classes.artistAvatarWrapper}
              >
                <Avatar
                  src={artist.avatar}
                  size={96}
                  radius="xl"
                />
              </Box>
              <Text size="sm" fw={700}>
                {artist.displayName || artist.username}
              </Text>
            </Stack>
          ))}
        </Flex>
      </Stack>
    </Container>
  );
}
