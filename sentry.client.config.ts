import * as Sentry from "@sentry/nextjs";

// Only initializes when NEXT_PUBLIC_SENTRY_DSN is set — safe to leave unset in dev
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Capture unhandled promise rejections and React render errors
  integrations: [],
});
