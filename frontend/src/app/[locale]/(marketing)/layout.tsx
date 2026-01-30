import { setRequestLocale } from 'next-intl/server';

export default async function MarketingLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  // Marketing pages now use the global AppLayoutShell from root layout
  // This layout just passes children through
  return <>{props.children}</>;
}
