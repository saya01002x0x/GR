'use client';

import type { UserProfile } from '@/mocks/dashboardData';
import { Box, Button, Flex, Group, Stack } from '@mantine/core';
import { useState } from 'react';
import {
  DashboardSidebar,
  ProfileForm,
  ProfileVisibility,
  SensitiveContent,
} from '@/components/dashboard';
import { mockUserProfile } from '@/mocks/dashboardData';

export default function ProfileSettingsPage() {
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
