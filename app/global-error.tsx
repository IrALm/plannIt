"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="bg-bg text-ink flex items-center justify-center min-h-screen">
        <div className="text-center px-6">
          <p className="font-serif text-xl mb-2">Oups, quelque chose a cassé.</p>
          <p className="text-ink-2 text-sm">Recharge la page pour réessayer.</p>
        </div>
      </body>
    </html>
  );
}
