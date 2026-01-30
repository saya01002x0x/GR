import { setRequestLocale } from 'next-intl/server';
import { ArtistsLayoutShell } from '@/components/layout';

export default async function ArtistsLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return <ArtistsLayoutShell>{props.children}</ArtistsLayoutShell>;
}
