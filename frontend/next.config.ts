import type { NextConfig } from 'next';

import createNextIntlPlugin from 'next-intl/plugin';
import './src/libs/Env';

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  transpilePackages: ['@gr/shared'],
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        hostname: 'localhost',
      },
      {
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'luminaaaa.studio',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: 'minio',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
};

// Initialize the Next-Intl plugin
let configWithPlugins = createNextIntlPlugin('./src/libs/I18n.ts')(baseConfig);

// Conditionally enable bundle analysis
if (process.env.ANALYZE === 'true') {
  // eslint-disable-next-line ts/no-require-imports
  const withBundleAnalyzer = require('@next/bundle-analyzer')();
  configWithPlugins = withBundleAnalyzer(configWithPlugins);
}

const finalConfig = configWithPlugins;
export default finalConfig;
