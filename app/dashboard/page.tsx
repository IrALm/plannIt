import { redirect } from "next/navigation";
import { parse } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/calendar/dashboard-view";
import { getWeekRange, getMonthGridRange, toAppTimeZoneInstant, todayYMD } from "@/lib/utils/date";
import { getEventsByRange } from "@/features/events/actions";
import { listEventTypes } from "@/features/calendar/actions";

type DashboardSearchParams = Promise<{ view?: string; month?: string; date?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const [{ data: profile }, { data: prefs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, profile_completed")
      .eq("id", user.id)
      .single(),
    supabase.from("user_preferences").select("default_reminders").eq("user_id", user.id).single(),
  ]);

  if (!profile?.profile_completed) redirect("/complete-profile");

  const params = await searchParams;
  const view: "week" | "month" = params.view === "month" ? "month" : "week";

  // Toujours résolu en Y-M-D pur (jamais en instant sérialisé) : "aujourd'hui"
  // est calculé au vrai fuseau de Paris via todayYMD() (fiable quel que soit
  // le fuseau système du serveur), et un Y-M-D fourni par le client (navigation
  // mois/jour) est repris tel quel — il a déjà été choisi dans son propre
  // fuseau réel côté navigateur.
  const anchorYMD = view === "month" ? (params.month ? `${params.month}-01` : todayYMD()) : (params.date ?? todayYMD());
  const anchorDate = parse(anchorYMD, "yyyy-MM-dd", new Date());

  const { start, end } =
    view === "month" ? getMonthGridRange(anchorDate) : getWeekRange(anchorDate);

  // Conversion en vrais instants UTC (heure de Paris) uniquement pour
  // interroger Supabase — jamais renvoyée telle quelle au client (cf.
  // lib/utils/date.ts pour le pourquoi).
  const startUTC = toAppTimeZoneInstant(start);
  const endUTC = toAppTimeZoneInstant(end);

  const [events, types] = await Promise.all([
    getEventsByRange(startUTC.toISOString(), endUTC.toISOString()),
    listEventTypes(),
  ]);

  const displayName = profile?.full_name || user.email?.split("@")[0] || "toi";

  return (
    <DashboardView
      displayName={displayName}
      avatarUrl={profile?.avatar_url ?? null}
      events={events}
      types={types}
      defaultReminders={prefs?.default_reminders ?? [30, 5]}
      view={view}
      anchorDate={anchorYMD}
    />
  );
}
