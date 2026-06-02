import type { Metadata } from 'next';
import { MantineColorSchemeScript } from '@/libs/MantineProvider';
import { AppConfig } from '@/utils/AppConfig';
import '@/styles/global.css';

export const metadata: Metadata = {
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
  ],
};

export default function RootLayout(props: {
  children: React.ReactNode;
}) {
  return (
    <html lang={AppConfig.defaultLocale} suppressHydrationWarning>
      <head>
        <MantineColorSchemeScript />
      </head>
      <body suppressHydrationWarning>
        {props.children}
      </body>
    </html>
  );
}
