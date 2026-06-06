import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';
import { Stack, Text, Title } from '@mantine/core';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { AuthPageLayout } from '@/components/auth';
import { getI18nPath } from '@/utils/Helpers';

// Check if Clerk is configured
const isClerkConfigured = !!(
  process.env.CLERK_SECRET_KEY
  && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);

type ISignInPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: ISignInPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'SignIn',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignInPage(props: ISignInPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  // Show placeholder when Clerk is not configured
  if (!isClerkConfigured) {
    return (
      <AuthPageLayout>
        <Stack align="center" justify="center" mih="60vh" ta="center">
          <Title order={2}>Authentication Disabled</Title>
          <Text c="dimmed">
            Clerk authentication is not configured.
            <br />
            Set CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in .env to enable.
          </Text>
          <Link
            href="/"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#e52e5c',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            Back to Home
          </Link>
        </Stack>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      <Stack gap="lg" mb="xl">
        <div>
          <Title order={1} fz={{ base: 'h2', md: 'h1' }} fw={900}>
            Welcome back
          </Title>
          <Text c="dimmed" size="md" mt="xs">
            Log in to share your art and support creators.
          </Text>
        </div>
      </Stack>
      <SignIn
        path={getI18nPath('/sign-in', locale)}
        signUpUrl={getI18nPath('/sign-up', locale)}
        appearance={{
          elements: {
            rootBox: { width: '100%' },
            card: {
              boxShadow: 'none',
              padding: '24px',
              backgroundColor: 'transparent',
            },
            headerTitle: { display: 'none' },
            headerSubtitle: { display: 'none' },
            socialButtonsBlockButton: {
              borderRadius: '8px',
              border: '1px solid #e5dcde',
            },
            formFieldInput: {
              borderRadius: '8px',
              border: '1px solid #e5dcde',
              height: '48px',
            },
            formButtonPrimary: {
              backgroundColor: '#e52e5c',
              borderRadius: '8px',
              height: '48px',
              fontSize: '16px',
              fontWeight: 700,
            },
            footerActionLink: {
              color: '#e52e5c',
            },
          },
        }}
      />
    </AuthPageLayout>
  );
}
