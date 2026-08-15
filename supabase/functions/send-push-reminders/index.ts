import webpush from "npm:web-push@3.6.7";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { captureException } from "../_shared/sentry.ts";

// Fenêtre de scan large (7 jours) : couvre n'importe quel rappel raisonnable
// (5 min à plusieurs jours avant l'événement, l'utilisateur choisit
// librement l'unité) sans avoir à connaître à l'avance la valeur max
// possible de `reminders`.
const LOOKAHEAD_MS = 7 * 24 * 60 * 60 * 1000;
// pg_cron tourne chaque minute : une marge de 10 min en arrière suffit à
// couvrir un tick manqué/retardé sans re-scanner indéfiniment le passé —
// nécessaire pour que le rappel "offset 0" (au début de l'événement, cf.
// plus bas) ait une chance de matcher start_at une fois l'événement démarré.
const LOOKBACK_MS = 10 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Appelée chaque minute par pg_cron (cf. migration 00011). Scanne les
 * événements à venir, détermine quels rappels (reminders, en minutes avant
 * start_at) sont dus et pas encore envoyés (reminders_sent), et pousse une
 * notification Web Push à chaque abonnement de l'utilisateur concerné.
 */
Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT");
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return json({ error: "vapid_not_configured" }, 500);
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const admin = createAdminClient();
  const now = new Date();

  try {
    const { data: events, error } = await admin
      .from("events")
      .select("id, user_id, title, start_at, reminders, reminders_sent")
      .gte("start_at", new Date(now.getTime() - LOOKBACK_MS).toISOString())
      .lte("start_at", new Date(now.getTime() + LOOKAHEAD_MS).toISOString());
    if (error) throw error;
    if (!events?.length) return json({ processed: 0 });

    type Due = { eventId: string; userId: string; title: string; startAt: string; offset: number };
    const due: Due[] = [];
    for (const ev of events) {
      const sent = new Set<number>(ev.reminders_sent ?? []);
      // 0 (= au début de l'événement) est toujours notifié, en plus des
      // rappels configurés — comportement voulu, pas une option à activer.
      const offsets = new Set<number>([...(ev.reminders ?? []), 0]);
      for (const offset of offsets) {
        if (sent.has(offset)) continue;
        const triggerAt = new Date(ev.start_at).getTime() - offset * 60_000;
        if (triggerAt <= now.getTime()) {
          due.push({ eventId: ev.id, userId: ev.user_id, title: ev.title, startAt: ev.start_at, offset });
        }
      }
    }
    if (!due.length) return json({ processed: 0 });

    const userIds = [...new Set(due.map((d) => d.userId))];
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth_key")
      .in("user_id", userIds);

    const subsByUser = new Map<string, typeof subs>();
    for (const s of subs ?? []) {
      const list = subsByUser.get(s.user_id) ?? [];
      list.push(s);
      subsByUser.set(s.user_id, list);
    }

    let sentCount = 0;
    const staleSubIds: string[] = [];
    const sentByEvent = new Map<string, number[]>();

    for (const d of due) {
      const userSubs = subsByUser.get(d.userId) ?? [];
      const time = new Date(d.startAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      const whenLabel =
        d.offset === 0
          ? "commence maintenant"
          : d.offset >= 1440
            ? `dans ${Math.round(d.offset / 1440)} j`
            : d.offset >= 60
              ? `dans ${Math.round(d.offset / 60)} h`
              : `dans ${d.offset} min`;
      const payload = JSON.stringify({
        title: d.title,
        body: d.offset === 0 ? `Ça ${whenLabel} — ${time}` : `${whenLabel} — ${time}`,
        tag: `event-${d.eventId}-${d.offset}`,
        eventId: d.eventId,
      });

      for (const sub of userSubs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
            payload
          );
          sentCount++;
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            // Abonnement expiré/révoqué côté navigateur : nettoyage.
            staleSubIds.push(sub.id);
          } else {
            await captureException(err, { function: "send-push-reminders", subscription_id: sub.id });
          }
        }
      }

      const offsets = sentByEvent.get(d.eventId) ?? [];
      offsets.push(d.offset);
      sentByEvent.set(d.eventId, offsets);
    }

    // Marqué "envoyé" même sans abonnement actif (utilisateur ayant désactivé
    // les push) : évite de re-scanner indéfiniment le même événement.
    for (const [eventId, offsets] of sentByEvent) {
      const ev = events.find((e) => e.id === eventId)!;
      const merged = [...new Set([...(ev.reminders_sent ?? []), ...offsets])];
      await admin.from("events").update({ reminders_sent: merged }).eq("id", eventId);
    }

    if (staleSubIds.length) {
      await admin.from("push_subscriptions").delete().in("id", staleSubIds);
    }

    return json({ processed: due.length, sent: sentCount, cleaned: staleSubIds.length });
  } catch (err) {
    await captureException(err, { function: "send-push-reminders" });
    return json({ error: String(err) }, 500);
  }
});
