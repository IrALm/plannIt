import { getUserFromRequest } from "../_shared/auth.ts";
import { EmailService } from "../_shared/email/EmailService.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { captureException } from "../_shared/sentry.ts";

// Seul email déclenché à la demande d'un utilisateur connecté : bienvenue.
// Le résumé hebdomadaire est un envoi groupé planifié, géré par la fonction
// séparée send-weekly-recap (cron, pas de JWT utilisateur).
type EmailRequest = { type: "welcome"; payload: { email: string; name?: string } };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const user = await getUserFromRequest(req);
  if (!user) return json({ error: "unauthorized" }, 401);

  const body = (await req.json().catch(() => null)) as EmailRequest | null;
  if (!body?.type || !body.payload) return json({ error: "invalid_payload" }, 400);

  const siteUrl = Deno.env.get("SITE_URL") ?? "https://plann-it-cyan.vercel.app";

  try {
    if (body.type !== "welcome") return json({ error: "unknown_type" }, 400);

    await EmailService.sendWelcomeEmail(
      { email: body.payload.email, name: body.payload.name },
      siteUrl
    );
    return json({ success: true });
  } catch (err) {
    // Une erreur d'envoi ne doit jamais remonter comme un échec bloquant côté
    // appelant (cf. lib/email/send.ts côté Next.js, appel best-effort).
    await captureException(err, { function: "send-email", type: body.type });
    return json({ success: false, error: String(err) }, 500);
  }
});
