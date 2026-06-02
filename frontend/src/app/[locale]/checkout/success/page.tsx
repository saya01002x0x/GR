'use client';

import { useAuth } from '@clerk/nextjs';
import { Alert, Button, Card, Center, Loader, Stack, Text, Title } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useSyncCheckoutSession } from '@/api/hooks/use-payments';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const isTierCheckout = searchParams.get('tier') === 'true';
  const { isLoaded, isSignedIn } = useAuth();
  const syncCheckout = useSyncCheckoutSession();

  useEffect(() => {
    if (
      !sessionId
      || !isLoaded
      || !isSignedIn
      || syncCheckout.isPending
      || syncCheckout.isSuccess
      || syncCheckout.isError
    ) {
      return;
    }

    syncCheckout.mutate({ sessionId });
  }, [isLoaded, isSignedIn, sessionId, syncCheckout]);

  const isSyncing
    = sessionId
      && isLoaded
      && isSignedIn
      && (syncCheckout.isIdle || syncCheckout.isPending);
  const needsSignIn = sessionId && isLoaded && !isSignedIn;
  const isActivating
    = sessionId && (!isLoaded || Boolean(isSyncing));

  return (
    <Center style={{ minHeight: '60vh' }}>
      <Card p="xl" radius="lg" withBorder maw={400} w="100%">
        <Stack align="center" gap="lg">
          {isActivating
            ? (
                <Loader size={64} />
              )
            : (
                <IconCheck size={64} color="var(--mantine-color-green-6)" />
              )}
          <Title order={2} ta="center">
            Payment Successful!
          </Title>
          <Text c="dimmed" ta="center">
            {isActivating
              ? 'We are activating your subscription.'
              : needsSignIn
                ? 'Payment completed. Please sign in again to finish activation.'
                : 'Thank you for your subscription. Your plan is now active.'}
          </Text>
          {syncCheckout.isError && (
            <Alert color="yellow" w="100%">
              Payment completed, but activation is still syncing. Please refresh
              this page in a moment.
            </Alert>
          )}
          {needsSignIn && (
            <Alert color="yellow" w="100%">
              Payment completed. Please sign in again to finish activation.
            </Alert>
          )}
          {!isTierCheckout && (
            <Text c="dimmed" size="sm" ta="center">
              You can manage your subscription anytime from the membership page.
            </Text>
          )}
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
