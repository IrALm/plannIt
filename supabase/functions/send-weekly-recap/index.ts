import { parse, addDays, format } from "npm:date-fns@4";
import { fr } from "npm:date-fns@4/locale";
import { fromZonedTime, formatInTimeZone } from "npm:date-fns-tz@3.2.0";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { EmailService } from "../_shared/email/EmailService.ts";
import { captureException } from "../_shared/sentry.ts";
import type { WeeklyRecapEvent } from "../_shared/email/templates.ts";

const APP_TIME_ZONE = "Europe/Paris";

// Dupliqué depuis features/calendar/types.ts (Next.js) — pas de module
// partagé entre l'app Next.js et les Edge Functions Deno dans ce projet.
const EVENT_COLOR_HEX: Record<string, string> = {
  blue: "#3B82F6",
  coral: "#F0674F",
  green: "#3FAF7A",
  amber: "#E0A63C",
  purple: "#9366CE",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getParisNowParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    weekday: get("weekday"),
    ymd: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  };
}

/**
 * Appelée toutes les 15 min par pg_cron (cf. migration 00013). Ne fait
 * réellement quelque chose que dans la fenêtre lundi 00h-01h à Paris — le
 * verrou weekly_recap_log garantit un seul envoi effectif par semaine même
 * si plusieurs invocations tombent dans cette fenêtre.
 */
Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const now = new Date();
  const paris = getParisNowParts(now);
  if (paris.weekday !== "Mon" || paris.hour !== 0) {
    return json({ skipped: true, reason: "not_in_window" });
  }

  const admin = createAdminClient();

  const { error: lockError } = await admin
    .from("weekly_recap_log")
    .insert({ week_start: paris.ymd });
  if (lockError) return json({ skipped: true, reason: "already_sent" });

  try {
    const weekStartLocal = parse(paris.ymd, "yyyy-MM-dd", new Date());
    const weekEndLocal = addDays(weekStartLocal, 6);
    const startUTC = fromZonedTime(weekStartLocal, APP_TIME_ZONE);
    const endUTC = fromZonedTime(
      new Date(weekEndLocal.getFullYear(), weekEndLocal.getMonth(), weekEndLocal.getDate(), 23, 59, 59, 999),
      APP_TIME_ZONE
    );
    const weekLabel = `${format(weekStartLocal, "d")} – ${format(weekEndLocal, "d MMM", { locale: fr })}`;

    const siteUrl = Deno.env.get("SITE_URL") ?? "https://plann-it-cyan.vercel.app";

    const [{ data: profiles }, { data: prefs }] = await Promise.all([
      admin.from("profiles").select("id, email, full_name"),
      admin.from("user_preferences").select("user_id, weekly_recap_enabled"),
    ]);

    const enabledUserIds = new Set(
      (prefs ?? []).filter((p) => p.weekly_recap_enabled).map((p) => p.user_id)
    );
    const eligible = (profiles ?? []).filter((p) => p.email && enabledUserIds.has(p.id));

    let sent = 0;
    for (const profile of eligible) {
      const [{ data: events }, { data: types }] = await Promise.all([
        admin
          .from("events")
          .select("title, start_at, event_type_id")
          .eq("user_id", profile.id)
          .gte("start_at", startUTC.toISOString())
          .lte("start_at", endUTC.toISOString())
          .order("start_at", { ascending: true }),
        admin.from("event_types").select("id, color").eq("user_id", profile.id),
      ]);

      if (!events?.length) continue;

      const colorById = new Map((types ?? []).map((t) => [t.id, t.color]));
      const highlights: WeeklyRecapEvent[] = events.slice(0, 6).map((e) => ({
        title: e.title,
        dayLabel: formatInTimeZone(new Date(e.start_at), APP_TIME_ZONE, "EEE", { locale: fr }).toUpperCase(),
        timeLabel: formatInTimeZone(new Date(e.start_at), APP_TIME_ZONE, "HH:mm"),
        color: EVENT_COLOR_HEX[colorById.get(e.event_type_id) ?? "blue"] ?? EVENT_COLOR_HEX.blue,
      }));

      const distinctTypeCount = new Set(events.map((e) => e.event_type_id).filter(Boolean)).size;
      const activeDayCount = new Set(
        events.map((e) => formatInTimeZone(new Date(e.start_at), APP_TIME_ZONE, "yyyy-MM-dd"))
      ).size;

      try {
        await EmailService.sendWeeklyRecap(
          { email: profile.email as string, name: profile.full_name ?? undefined },
          siteUrl,
          {
            weekLabel,
            totalCount: events.length,
            distinctTypeCount,
            activeDayCount,
            highlights,
            moreCount: Math.max(0, events.length - highlights.length),
          }
        );
        sent++;
      } catch (err) {
        await captureException(err, { function: "send-weekly-recap", user_id: profile.id });
      }
    }

    return json({ weekStart: paris.ymd, eligible: eligible.length, sent });
  } catch (err) {
    await captureException(err, { function: "send-weekly-recap" });
    return json({ error: String(err) }, 500);
  }
});
