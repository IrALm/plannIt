import { getUserFromRequest } from "../_shared/auth.ts";
import { EmailService } from "../_shared/email/EmailService.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { captureException } from "../_shared/sentry.ts";

// Rappels programmés (event_reminder à J-30min/1h/2h) : nécessitent une brique
// d'ordonnancement (pg_cron + pg_net, ou Supabase Scheduled Function) qui n'est
// pas mise en place dans cette passe — cf. plan M7, "à décider avec l'utilisateur".
// La fonction sait déjà envoyer ce type d'email (EmailService.sendEventReminder),
// il ne manque que le déclencheur programmé.

type EmailRequest =
  | { type: "welcome"; payload: { email: string; name?: string } }
  | { type: "event_created"; payload: { email: string; title: string; whenLabel: string } }
  | {
      type: "event_reminder";
      payload: { email: string; title: string; whenLabel: string; minutesBefore: number };
    }
  | { type: "notification"; payload: { email: string; subject: string; message: string } };

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

  try {
    switch (body.type) {
      case "welcome":
        await EmailService.sendWelcomeEmail({
          email: body.payload.email,
          name: body.payload.name,
        });
        break;
      case "event_created":
        await EmailService.sendEventCreatedEmail(
          { email: body.payload.email },
          body.payload.title,
          body.payload.whenLabel
        );
        break;
      case "event_reminder":
        await EmailService.sendEventReminder(
          { email: body.payload.email },
          body.payload.title,
          body.payload.whenLabel,
          body.payload.minutesBefore
        );
        break;
      case "notification":
        await EmailService.sendNotificationEmail(
          { email: body.payload.email },
          body.payload.subject,
          body.payload.message
        );
        break;
      default:
        return json({ error: "unknown_type" }, 400);
    }
    return json({ success: true });
  } catch (err) {
    // Une erreur d'envoi ne doit jamais remonter comme un échec bloquant côté
    // appelant (cf. lib/email/send.ts côté Next.js, appels best-effort).
    await captureException(err, { function: "send-email", type: body.type });
    return json({ success: false, error: String(err) }, 500);
  }
});
