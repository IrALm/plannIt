import path from "path";
import type { NextConfig } from "next";
import withPWAInit, { runtimeCaching as defaultCache } from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    disableDevLogs: true,
    // Jamais mis en cache : callback OAuth/reset-password, appels API, et le
    // domaine Supabase lui-même — un NetworkFirst par défaut ferait
    // exceptionnellement fallback sur une réponse cache en cas d'offline, ce
    // qu'on refuse explicitement ici pour tout ce qui touche à l'auth/API.
    runtimeCaching: [
      {
        urlPattern: ({ url }: { url: URL }) =>
          url.pathname.startsWith("/auth/") || url.pathname.startsWith("/api/"),
        handler: "NetworkOnly",
      },
      {
        urlPattern: ({ url }: { url: URL }) =>
          url.hostname.endsWith(".supabase.co"),
        handler: "NetworkOnly",
      },
      ...defaultCache,
    ],
  },
});

export default withSentryConfig(withPWA(nextConfig), {
  silent: true,
  // org/project à renseigner une fois le projet Sentry créé (ou via les env
  // vars SENTRY_ORG / SENTRY_PROJECT) — sans ça, l'upload de source maps est
  // simplement ignoré, le SDK runtime fonctionne quand même.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
});
