'use client';

import type { UserProfile } from '@/mocks/dashboardData';
import { useUser } from '@clerk/nextjs';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Card,
  FileButton,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import {
  IconBrandInstagram,
  IconBrandTwitter,
  IconCamera,
  IconLink,
  IconUpload,
} from '@tabler/icons-react';
import { useState } from 'react';

type ProfileFormProps = {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
};

export function ProfileForm({ profile, onChange }: ProfileFormProps) {
  const { user, isLoaded } = useUser();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleChange = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    onChange({ ...profile, [key]: value });
  };

  const handleSocialChange = (key: keyof UserProfile['social'], value: string) => {
    onChange({
      ...profile,
      social: { ...profile.social, [key]: value },
    });
  };

  // Handle avatar upload via Clerk
  const handleAvatarUpload = async (file: File | null) => {
    if (!file || !user) {
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await user.setProfileImage({ file });
      // Update local state with new image URL
      handleChange('avatar', user.imageUrl);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Remove avatar (set to default)
  const handleRemoveAvatar = async () => {
    if (!user) {
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await user.setProfileImage({ file: null });
      handleChange('avatar', '');
    } catch (error) {
      console.error('Failed to remove avatar:', error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Get avatar URL - prefer Clerk's user.imageUrl, fallback to profile.avatar
  const avatarUrl = isLoaded && user?.imageUrl ? user.imageUrl : profile.avatar;

  return (
    <Stack gap="xl">
      {/* Page Header */}
      <Box>
        <Title order={2} mb="xs">
          Edit Profile
        </Title>
        <Text c="dimmed" size="sm">
          Update your public profile information and visibility settings.
        </Text>
      </Box>

      {/* Avatar & Banner Section */}
      <Card withBorder radius="lg" p="lg">
        <Title order={4} mb="lg">
          Avatar & Banner
        </Title>

        <Group align="flex-start" gap="xl">
          {/* Avatar */}
          <Stack align="center" gap="sm">
            <Box pos="relative">
              <Avatar
                src={avatarUrl}
                size={96}
                radius="xl"
              >
                {isUploadingAvatar && <Loader size="sm" />}
              </Avatar>
              <FileButton
                accept="image/png,image/jpeg,image/gif"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
              >
                {props => (
                  <ActionIcon
                    {...props}
                    pos="absolute"
                    bottom={0}
                    right={0}
                    size="sm"
                    radius="xl"
                    variant="filled"
                    loading={isUploadingAvatar}
                  >
                    <IconCamera size={14} />
                  </ActionIcon>
                )}
              </FileButton>
            </Box>
            <Group gap="xs">
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                onClick={handleRemoveAvatar}
                disabled={isUploadingAvatar || !avatarUrl}
              >
                Remove
              </Button>
              <FileButton
                accept="image/png,image/jpeg,image/gif"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
              >
                {props => (
                  <Button {...props} size="xs" variant="light" loading={isUploadingAvatar}>
                    Upload New
                  </Button>
                )}
              </FileButton>
            </Group>
            <Text size="xs" c="dimmed">
              PNG, JPG, GIF. Clerk handles resizing.
            </Text>
          </Stack>

          {/* Banner */}
          <Box flex={1}>
            <Box
              pos="relative"
              h={120}
              style={{
                borderRadius: 'var(--mantine-radius-md)',
                overflow: 'hidden',
                backgroundImage: profile.banner ? `url(${profile.banner})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: profile.banner ? undefined : 'var(--mantine-color-gray-2)',
              }}
            >
              <Box
                pos="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
              >
                <FileButton
                  accept="image/png,image/jpeg"
                  onChange={() => {
                    // TODO: Handle banner upload (requires separate storage)
                  }}
                >
                  {props => (
                    <Button
                      {...props}
                      variant="white"
                      size="sm"
                      leftSection={<IconUpload size={16} />}
                    >
                      Update
                    </Button>
                  )}
                </FileButton>
              </Box>
            </Box>
            <Text size="xs" c="dimmed" mt="xs">
              Recommended: 1500x500px
            </Text>
          </Box>
        </Group>
      </Card>

      {/* Basic Information Section */}
      <Card withBorder radius="lg" p="lg">
        <Title order={4} mb="lg">
          Basic Information
        </Title>

        <Stack gap="md">
          <TextInput
            label="Display Name"
            placeholder="Your display name"
            value={profile.displayName}
            onChange={e => handleChange('displayName', e.target.value)}
          />

          <TextInput
            label="Handle"
            placeholder="username"
            leftSection={<Text size="sm" c="dimmed">@</Text>}
            value={profile.handle}
            onChange={e => handleChange('handle', e.target.value)}
          />

          <Textarea
            label="Bio"
            placeholder="Tell the community a bit about yourself..."
            minRows={3}
            maxLength={160}
            value={profile.bio}
            onChange={e => handleChange('bio', e.target.value)}
            description={`${profile.bio.length}/160`}
          />
        </Stack>
      </Card>

      {/* Social Links Section */}
      <Card withBorder radius="lg" p="lg">
        <Title order={4} mb="lg">
          Social Links
        </Title>

        <Stack gap="md">
          <TextInput
            label="Twitter"
            placeholder="Twitter username"
            leftSection={<IconBrandTwitter size={18} />}
            value={profile.social.twitter || ''}
            onChange={e => handleSocialChange('twitter', e.target.value)}
          />

          <TextInput
            label="Instagram"
            placeholder="Instagram username"
            leftSection={<IconBrandInstagram size={18} />}
            value={profile.social.instagram || ''}
            onChange={e => handleSocialChange('instagram', e.target.value)}
          />

          <TextInput
            label="Personal Website"
            placeholder="https://your-website.com"
            leftSection={<IconLink size={18} />}
            value={profile.social.website || ''}
            onChange={e => handleSocialChange('website', e.target.value)}
          />
        </Stack>
      </Card>
    </Stack>
  );
}
