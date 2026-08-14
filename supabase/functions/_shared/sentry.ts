/**
 * Reporter Sentry minimal, fetch-based — pas de dépendance @sentry/deno dont
 * la compatibilité avec le runtime Edge Functions de Supabase n'était pas
 * garantie au moment de l'écriture (cf. plan M3/_shared). Construit
 * l'endpoint envelope à partir du DSN et poste un événement d'erreur minimal.
 * Best-effort : un échec d'envoi à Sentry ne doit jamais faire planter la
 * fonction appelante.
 */
export async function captureException(error: unknown, tags: Record<string, string> = {}) {
  const dsn = Deno.env.get("SENTRY_DSN");
  if (!dsn) {
    console.error(error);
    return;
  }

  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\//, "");
    const envelopeUrl = `${url.protocol}//${url.host}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`;

    const eventId = crypto.randomUUID().replace(/-/g, "");
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    const header = JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() });
    const itemHeader = JSON.stringify({ type: "event" });
    const item = JSON.stringify({
      event_id: eventId,
      timestamp: Date.now() / 1000,
      platform: "other",
      level: "error",
      tags,
      exception: {
        values: [{ type: "Error", value: message, stacktrace: stack ? { frames: [] } : undefined }],
      },
      extra: { stack },
    });

    await fetch(envelopeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body: `${header}\n${itemHeader}\n${item}\n`,
    });
  } catch {
    // Sentry injoignable : au moins logger dans les logs de la fonction.
    console.error("Sentry reporting failed for:", error);
  }
}
