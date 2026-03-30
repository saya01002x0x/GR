'use client';

import type { UserProfile } from '@/mocks/dashboardData';
import { useUser } from '@clerk/nextjs';
import { Box, Button, Flex, Group, Skeleton, Stack } from '@mantine/core';
import { useState } from 'react';
import {
  DashboardSidebar,
  ProfileForm,
  ProfileVisibility,
  SensitiveContent,
} from '@/components/dashboard';
import { mockUserProfile } from '@/mocks/dashboardData';

export default function ProfileSettingsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [hasChanges, setHasChanges] = useState(false);

  const handleProfileChange = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setHasChanges(true);
  };

  const handleVisibilityChange = (visibility: UserProfile['visibility']) => {
    setProfile(prev => ({ ...prev, visibility }));
    setHasChanges(true);
  };

  const handleSensitiveChange = (sensitiveContent: UserProfile['sensitiveContent']) => {
    setProfile(prev => ({ ...prev, sensitiveContent }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    setHasChanges(false);
  };

  const handleCancel = () => {
    setProfile(mockUserProfile);
    setHasChanges(false);
  };

  if (!isLoaded) {
    return (
      <Box maw={1400} mx="auto" px={{ base: 'md', md: 'xl' }} py="xl">
        <Flex direction={{ base: 'column', lg: 'row' }} gap="xl">
          {/* Skeleton for Left Column */}
          <Box w={{ base: '100%', lg: 250 }}>
            <Skeleton height={400} radius="md" />
          </Box>
          {/* Skeleton for Right Column */}
          <Box flex={1} miw={0}>
            <Stack gap="xl">
              <Skeleton height={250} radius="md" />
              <Skeleton height={150} radius="md" />
              <Skeleton height={150} radius="md" />
            </Stack>
          </Box>
        </Flex>
      </Box>
    );
  }

  // If FOUC needs sign in protection from frontend, we wait until loaded. Next.js middleware typically redirects but we might see a flash if we don't return early above.
  if (!isSignedIn) {
    return null; // Will be redirected by middleware anyway
  }

  return (
    <Box maw={1400} mx="auto" px={{ base: 'md', md: 'xl' }} py="xl">
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        gap="xl"
      >
        {/* Left Column - Sidebar Navigation (Sticky) */}
        <DashboardSidebar />

        {/* Right Column - Main Content */}
        <Box flex={1} miw={0}>
          <Stack gap="xl">
            {/* Profile Form */}
            <ProfileForm
              profile={profile}
              onChange={handleProfileChange}
            />

            {/* Profile Visibility */}
            <ProfileVisibility
              visibility={profile.visibility}
              onChange={handleVisibilityChange}
            />

            {/* Sensitive Content Settings */}
            <SensitiveContent
              settings={profile.sensitiveContent}
              onChange={handleSensitiveChange}
            />

            {/* Action Buttons */}
            <Group justify="flex-end" gap="md">
              <Button
                variant="default"
                size="md"
                onClick={handleCancel}
                disabled={!hasChanges}
              >
                Cancel
              </Button>
              <Button
                size="md"
                onClick={handleSave}
                disabled={!hasChanges}
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        </Box>
      </Flex>
    </Box>
  );
}
