import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import { AppConfig } from '@/utils/AppConfig';
import '@/styles/global.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sans',
});

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
    <html lang={AppConfig.defaultLocale} suppressHydrationWarning className={plusJakartaSans.variable}>
      <head suppressHydrationWarning>
        <Script
          id="mantine-color-scheme"
          data-mantine-script
          strategy="beforeInteractive"
        >
          {`try {
  var _colorScheme = window.localStorage.getItem("mantine-color-scheme-value");
  var colorScheme = _colorScheme === "light" || _colorScheme === "dark" || _colorScheme === "auto" ? _colorScheme : "auto";
  var computedColorScheme = colorScheme !== "auto" ? colorScheme : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.setAttribute("data-mantine-color-scheme", computedColorScheme);
} catch (e) {}`}
        </Script>
      </head>
      <body suppressHydrationWarning>
        {props.children}
      </body>
    </html>
  );
}
