import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ArtistSpotlight } from '@/components/heropage/ArtistSpotlight';
import { HeroFooter } from '@/components/heropage/HeroFooter';
import { HeroSection } from '@/components/heropage/HeroSection';
import { TrendingSection } from '@/components/heropage/TrendingSection';

type IIndexProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'ArtPulse | Discover Your Next Inspiration',
    description: 'Join a global community of over 5 million artists and art lovers. Share your vision, find your muse, and grow together.',
  };
}

export default async function Index(props: IIndexProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <TrendingSection />
      <ArtistSpotlight />
      <HeroFooter />
    </>
  );
}
