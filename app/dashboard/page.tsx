import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/calendar/dashboard-view";
import { getWeekRange } from "@/lib/utils/date";
import { getEventsByRange } from "@/features/events/actions";
import { listEventTypes } from "@/features/calendar/actions";

export default async function DashboardPage() {
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

  const { start, end } = getWeekRange(new Date());
  const [events, types] = await Promise.all([
    getEventsByRange(start.toISOString(), end.toISOString()),
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
    />
  );
}
