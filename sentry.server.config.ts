import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Silencieux tant que NEXT_PUBLIC_SENTRY_DSN n'est pas renseigné (dsn undefined = SDK désactivé).
});
