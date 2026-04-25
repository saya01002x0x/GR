'use client';

import { Button, Card, Center, Stack, Text, Title } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <Center style={{ minHeight: '60vh' }}>
      <Card p="xl" radius="lg" withBorder maw={400} w="100%">
        <Stack align="center" gap="lg">
          <IconCheck size={64} color="var(--mantine-color-green-6)" />
          <Title order={2} ta="center">
            Payment Successful!
          </Title>
          <Text c="dimmed" ta="center">
            Thank you for your subscription. Your plan is now active.
          </Text>
          <Text c="dimmed" size="sm" ta="center">
            You can manage your subscription anytime from the membership page.
          </Text>
          <Button component={Link} href="/dashboard/membership">
            Go to Membership
          </Button>
          <Button component={Link} href="/" variant="default">
            Back to Home
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}
