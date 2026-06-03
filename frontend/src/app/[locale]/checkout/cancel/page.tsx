'use client';

import { Button, Card, Center, Stack, Text, Title } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <Center style={{ minHeight: '60vh' }}>
      <Card p="xl" radius="lg" withBorder maw={400} w="100%">
        <Stack align="center" gap="lg">
          <IconX size={64} color="var(--mantine-color-red-6)" />
          <Title order={2} ta="center">
            Payment Canceled
          </Title>
          <Text c="dimmed" ta="center">
            Your payment was canceled. No charges were made.
          </Text>
          <Text c="dimmed" size="sm" ta="center">
            You can try again anytime from the membership page.
          </Text>
          <Button component={Link} href="/dashboard/membership">
            Try Again
          </Button>
          <Button component={Link} href="/" variant="default">
            Back to Home
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}
