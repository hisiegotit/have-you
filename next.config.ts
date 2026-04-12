import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress Sentry CLI output in non-CI environments
  silent: !process.env.CI,
  // Source map upload requires SENTRY_ORG + SENTRY_PROJECT env vars; safe to omit
  telemetry: false,
});
