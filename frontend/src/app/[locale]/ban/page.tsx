'use client';

import { SignOutButton } from '@clerk/nextjs';
import {
  Alert,
  Box,
  Button,
  Center,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconBan, IconLogout } from '@tabler/icons-react';
import { useUserProfile } from '@/api/hooks';

export default function BanPage() {
  const { data: profile } = useUserProfile();

  return (
    <Center mih="calc(100vh - 180px)" px="md">
      <Box maw={520} w="100%">
        <Stack gap="lg" align="center" ta="center">
          <IconBan size={56} color="var(--mantine-color-red-6)" />
          <div>
            <Title order={1}>Account suspended</Title>
            <Text c="dimmed" mt="sm">
              Your account has been banned and cannot access this application.
            </Text>
          </div>

          <Alert color="red" variant="light" w="100%">
            {profile?.bannedUntil
              ? `This suspension is scheduled to end on ${new Date(profile.bannedUntil).toLocaleDateString('vi-VN')}.`
              : 'This suspension does not have an automatic end date.'}
          </Alert>

          <SignOutButton>
            <Button color="red" leftSection={<IconLogout size={18} />}>
              Sign out
            </Button>
          </SignOutButton>
        </Stack>
      </Box>
    </Center>
  );
}
