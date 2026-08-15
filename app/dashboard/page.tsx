import { redirect } from "next/navigation";
import { parse, subMonths } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/calendar/dashboard-view";
import {
  getWeekRange,
  getMonthGridRange,
  getMonthRange,
  getYearRange,
  toAppTimeZoneInstant,
  todayYMD,
} from "@/lib/utils/date";
import { getEventsByRange } from "@/features/events/actions";
import { listEventTypes } from "@/features/calendar/actions";
import { getHourlyForecast } from "@/lib/weather/forecast";

type DashboardSearchParams = Promise<{
  view?: string;
  month?: string;
  date?: string;
  period?: string;
  year?: string;
}>;

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
    supabase
      .from("user_preferences")
      .select("default_reminders, weather_lat, weather_lon")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!profile?.profile_completed) redirect("/complete-profile");

  const params = await searchParams;
  const view: "week" | "month" | "stats" =
    params.view === "month" ? "month" : params.view === "stats" ? "stats" : "week";
  const statsPeriod: "month" | "year" = params.period === "year" ? "year" : "month";

  // Toujours résolu en Y-M-D pur (jamais en instant sérialisé) : "aujourd'hui"
  // est calculé au vrai fuseau de Paris via todayYMD() (fiable quel que soit
  // le fuseau système du serveur), et un Y-M-D fourni par le client (navigation
  // mois/jour/année) est repris tel quel — il a déjà été choisi dans son
  // propre fuseau réel côté navigateur.
  let anchorYMD: string;
  if (view === "month") {
    anchorYMD = params.month ? `${params.month}-01` : todayYMD();
  } else if (view === "stats") {
    anchorYMD =
      statsPeriod === "year"
        ? `${params.year ?? todayYMD().slice(0, 4)}-01-01`
        : params.month
          ? `${params.month}-01`
          : todayYMD();
  } else {
    anchorYMD = params.date ?? todayYMD();
  }
  const anchorDate = parse(anchorYMD, "yyyy-MM-dd", new Date());

  const { start, end } =
    view === "month"
      ? getMonthGridRange(anchorDate)
      : view === "stats"
        ? statsPeriod === "year"
          ? getYearRange(anchorDate)
          : getMonthRange(anchorDate)
        : getWeekRange(anchorDate);

  // Conversion en vrais instants UTC (heure de Paris) uniquement pour
  // interroger Supabase — jamais renvoyée telle quelle au client (cf.
  // lib/utils/date.ts pour le pourquoi).
  const startUTC = toAppTimeZoneInstant(start);
  const endUTC = toAppTimeZoneInstant(end);

  // Coaching passif (vue Stats, mois) : compare au mois précédent — n'a de
  // sens qu'en vue mois, pas en vue année.
  const needsPreviousMonth = view === "stats" && statsPeriod === "month";
  const previousMonthRange = needsPreviousMonth ? getMonthRange(subMonths(anchorDate, 1)) : null;

  const hasWeatherLocation = prefs?.weather_lat != null && prefs?.weather_lon != null;

  const [events, types, previousPeriodEvents, hourlyForecast] = await Promise.all([
    getEventsByRange(startUTC.toISOString(), endUTC.toISOString()),
    listEventTypes(),
    previousMonthRange
      ? getEventsByRange(
          toAppTimeZoneInstant(previousMonthRange.start).toISOString(),
          toAppTimeZoneInstant(previousMonthRange.end).toISOString()
        )
      : Promise.resolve([]),
    hasWeatherLocation ? getHourlyForecast(prefs!.weather_lat!, prefs!.weather_lon!) : Promise.resolve([]),
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
      statsPeriod={statsPeriod}
      previousPeriodEvents={previousPeriodEvents}
      hourlyForecast={hourlyForecast}
    />
  );
}
