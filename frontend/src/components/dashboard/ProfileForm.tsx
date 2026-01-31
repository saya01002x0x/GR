'use client';

import type { UserProfile } from '@/mocks/dashboardData';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Card,
  FileButton,
  Group,
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

type ProfileFormProps = {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
};

export function ProfileForm({ profile, onChange }: ProfileFormProps) {
  const handleChange = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    onChange({ ...profile, [key]: value });
  };

  const handleSocialChange = (key: keyof UserProfile['social'], value: string) => {
    onChange({
      ...profile,
      social: { ...profile.social, [key]: value },
    });
  };

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
                src={profile.avatar}
                size={96}
                radius="xl"
              />
              <FileButton
                accept="image/png,image/jpeg,image/gif"
                onChange={() => {
                  // TODO: Handle avatar upload
                }}
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
                onClick={() => handleChange('avatar', '')}
              >
                Remove
              </Button>
              <FileButton
                accept="image/png,image/jpeg,image/gif"
                onChange={() => {
                  // TODO: Handle avatar upload
                }}
              >
                {props => (
                  <Button {...props} size="xs" variant="light">
                    Upload New
                  </Button>
                )}
              </FileButton>
            </Group>
            <Text size="xs" c="dimmed">
              PNG, JPG, GIF. Max 5MB
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
                    // TODO: Handle banner upload
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
