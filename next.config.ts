import type { NextConfig } from "next";
// @ts-expect-error next-pwa lacks type declarations
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
      handler: 'NetworkFirst',
      options: { cacheName: 'supabase-api', expiration: { maxEntries: 50, maxAgeSeconds: 300 } }
    },
    {
      urlPattern: /\/api\/dashboard\/summary/,
      handler: 'NetworkFirst',
      options: { cacheName: 'dashboard', expiration: { maxEntries: 10, maxAgeSeconds: 60 } }
    }
  ]
});

const nextConfig: NextConfig = {};

import { withSentryConfig } from '@sentry/nextjs';

export default withSentryConfig(withPWA(nextConfig), {
  silent: true,
  org: "luna",
  project: "luna-app",
  widenClientFileUpload: true,
  transpileClientSDK: true,
  hideSourceMaps: true,
});
