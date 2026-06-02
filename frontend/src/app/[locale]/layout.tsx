import { ClerkProvider } from '@clerk/nextjs';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AppLayoutShell } from '@/components/layout';
import { routing } from '@/libs/I18nRouting';
import { MantineProvider } from '@/libs/MantineProvider';
import { QueryProvider } from '@/libs/QueryProvider';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <ClerkProvider>
      <MantineProvider>
        <QueryProvider>
          <NextIntlClientProvider>
            <AppLayoutShell>
              {props.children}
            </AppLayoutShell>
          </NextIntlClientProvider>
        </QueryProvider>
      </MantineProvider>
    </ClerkProvider>
  );
}
