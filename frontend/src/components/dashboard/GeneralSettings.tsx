'use client';

import { useUser } from '@clerk/nextjs';
import {
  Box,
  Button,
  Card,
  Grid,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAt, IconWorld } from '@tabler/icons-react';

export function GeneralSettings() {
  const { user } = useUser();

  return (
    <Stack gap="xl">
      {/* Page Header */}
      <Box pb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
        <Title order={2} mb="xs">
          General Settings
        </Title>
        <Text c="dimmed" size="sm">
          Manage your login details and regional preferences.
        </Text>
      </Box>

      {/* Account Information */}
      <Card withBorder radius="lg" p="lg">
        <Title order={4} mb="lg">
          Account Information
        </Title>

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Email Address"
              value={user?.primaryEmailAddress?.emailAddress || ''}
              readOnly
              rightSection={(
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="primary"
                >
                  Change
                </Button>
              )}
              rightSectionWidth={70}
              styles={{
                input: {
                  backgroundColor: 'var(--mantine-color-gray-0)',
                },
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="User ID"
              value={user?.id || ''}
              readOnly
              disabled
              styles={{
                input: {
                  backgroundColor: 'var(--mantine-color-gray-1)',
                },
              }}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Password Section */}
      <Card withBorder radius="lg" p="lg">
        <Title order={4} mb="lg">
          Password
        </Title>

        {user?.passwordEnabled
          ? (
              <Stack gap="md" maw={600}>
                <TextInput
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                />
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="New Password"
                      type="password"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Confirm New Password"
                      type="password"
                    />
                  </Grid.Col>
                </Grid>
              </Stack>
            )
          : (
              <Box
                p="md"
                style={{
                  backgroundColor: 'var(--mantine-color-gray-0)',
                  borderRadius: 'var(--mantine-radius-md)',
                }}
              >
                <Text size="sm" c="dimmed">
                  Your account is managed through Google. Password changes are handled via your Google account settings.
                </Text>
              </Box>
            )}
      </Card>

      {/* Language & Region */}
      <Card withBorder radius="lg" p="lg">
        <Title order={4} mb="lg">
          Language & Region
        </Title>

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Display Language"
              leftSection={<IconWorld size={18} />}
              data={[
                { value: 'en', label: 'English' },
                { value: 'ja', label: 'Japanese (日本語)' },
                { value: 'ko', label: 'Korean (한국어)' },
                { value: 'zh', label: 'Chinese (中文)' },
                { value: 'vi', label: 'Vietnamese (Tiếng Việt)' },
              ]}
              defaultValue="en"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Region"
              leftSection={<IconAt size={18} />}
              data={[
                { value: 'us', label: 'United States' },
                { value: 'jp', label: 'Japan' },
                { value: 'kr', label: 'South Korea' },
                { value: 'uk', label: 'United Kingdom' },
                { value: 'vn', label: 'Vietnam' },
                { value: 'de', label: 'Germany' },
              ]}
              defaultValue="us"
              description="This helps us show you relevant content and events."
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Save Buttons */}
      <Group justify="flex-end" gap="md">
        <Button variant="default" size="md">
          Cancel
        </Button>
        <Button size="md">
          Save Changes
        </Button>
      </Group>
    </Stack>
  );
}
