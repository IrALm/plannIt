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

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { start, end } = getWeekRange(new Date());
  const [events, types] = await Promise.all([
    getEventsByRange(start.toISOString(), end.toISOString()),
    listEventTypes(),
  ]);

  const displayName = profile?.full_name || user.email?.split("@")[0] || "toi";

  return <DashboardView displayName={displayName} events={events} types={types} />;
}
