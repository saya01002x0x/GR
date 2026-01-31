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
import classes from './ArtistSpotlight.module.css';

const artists = [
  {
    name: 'Elena Ross',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuc9BcPnmPK7eu9RF_0DjbcMrggJ2lgI9gOeT6_Mw0ahN_M1wLX988frPqJjHCqLhCI74fBb7qbD2F-BuaeVD0v6WnFQgIftSZc7GjyJeMqMItppA4uVfPJxnk8d439A8J4E7i6hNQ-XcttfzXQ__z3aYiSa7iJTEkQDXLXlj1oR0ddUw0Uz08TCy_xZnct0hK6SD0yMpVuvQHewnlWsVy7AhhLJy4aGwCCJPkgoyd-4yrKaktz7TI5GsAXTh2c6fssb_bZIN5GFM',
    featured: true,
  },
  {
    name: 'Marcus K.',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdow4OGtJXkKiadXqxIBI2-5S62EF5fe-ez9VEnQNc53AbDxZ01bWmz_DH_DPgr0SAkNGxK0j9tY7HVN1lEY4eDo605D7du8mdhvqfdCeuFsJiLYWOuS6bhneX8KhgC496Vej_h7UAHT48h179iOCk4kP_kIaL3eRHhKrUFHVccVyNHiY1yQV8xRCLFmlsw1GovghjDlYNj7HT1HblJrn2nbDVOtVSzyaJtyL97EYUZNjyZr7tZRa0HszhKlu7L5v2aTOyyGZ61kc',
  },
  {
    name: 'Sarah Chen',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsYVAAbr6zA6MWcK_iwXtXiWpdWsK0c4ZlrvExD1ewszba8yHYEZNp1AchVws6YXC0cjkjwvOwayOcUS-KBUWdUPhSUVCTJXYiPbvdDqFcFguYA-cGuFG6c4mRKpAjKRWr7IB3NDHG_CyZSpaq7ZSFFsz1s682bOGrLHjS0lJlvcdiqdiFhDB3FMz6Sv5r3TTVI4oXPVdSw0jw-gExhn9YRthi0scbWRY7QpP2fhOO7JEkGcmICnLWRqMjn_e2mnlCWTFk-IhGaXc',
  },
  {
    name: 'David Miller',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcIOGqrCPdB4HYJWGukea_jeYOJmmfU6JzQgTjAx3OILCzJH_YlAgkVSr7xJiEQ2iecd-TyCgXrkI9V7QuLspgEn6MHCleZFbBjxMHgsCiTp4acRba5duJuxEHO7mQ-ubsc0lYVPc5a-Yu3KtGV_itlhoXYYDsB7hzkhZiBkCOKv4sfIk7BpQrC1oUqiq69brmKpH6VkxNxOIDm2SvridepMgRnmDGLZ3NdWbvaAQESdxtsGX7APBwgkrkgnXlWgz8DXSFgU_aB-s',
  },
];

export function ArtistSpotlight() {
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
            <Stack key={artist.name} align="center" gap="sm">
              <Box
                p={2}
                style={{
                  borderRadius: '50%',
                  border: `2px solid ${artist.featured ? 'var(--mantine-color-primary-6)' : 'transparent'}`,
                  transition: 'border-color 0.2s ease',
                  cursor: 'pointer',
                }}
                className={`${classes.artistAvatarWrapper} ${artist.featured ? classes.featured : ''}`}
              >
                <Avatar
                  src={artist.avatar}
                  size={96}
                  radius="xl"
                />
              </Box>
              <Text size="sm" fw={700}>
                {artist.name}
              </Text>
            </Stack>
          ))}
        </Flex>
      </Stack>
    </Container>
  );
}
