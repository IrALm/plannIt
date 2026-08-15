import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut, signInWithGoogle } from "@/features/auth/actions";
import { disconnectGoogleCalendarAction } from "./actions";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/google-icon";
import { ProfileSection } from "@/components/settings/profile-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { RemindersSection } from "@/components/settings/reminders-section";
import { InstallCard } from "@/components/pwa/install-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PushNotificationsToggle } from "@/components/settings/push-notifications-toggle";

export default async function SettingsPage() {
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
      .select("google_calendar_connected, google_email, default_reminders")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!profile?.profile_completed) redirect("/complete-profile");

  const connected = prefs?.google_calendar_connected ?? false;

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col px-[18px] pt-2 pb-6 gap-[18px] max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="size-[38px] rounded-chip border border-line bg-surface text-ink-2 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-serif text-[22px] flex-1">Réglages</h1>
        <ThemeToggle />
      </div>

      <ProfileSection
        name={profile?.full_name ?? ""}
        email={user.email ?? ""}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <div>
        <div className="font-mono text-[10px] tracking-[.14em] uppercase text-muted mb-2">
          Google Calendar
        </div>
        <div className="flex items-center gap-3 bg-surface border border-line rounded-card p-[13px]">
          <GoogleIcon size={24} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">
              {connected ? "Connectée" : "Non connectée"}
            </div>
            {connected && prefs?.google_email && (
              <div className="font-mono text-[11.5px] text-muted mt-0.5 truncate">
                {prefs.google_email}
              </div>
            )}
          </div>
          {connected && (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-accent shrink-0">
              <Check size={13} /> Actif
            </span>
          )}
        </div>
        <form action={connected ? disconnectGoogleCalendarAction : signInWithGoogle} className="mt-2">
          <Button type="submit" variant="secondary">
            {connected ? "Déconnecter" : "Connecter Google Calendar"}
          </Button>
        </form>
      </div>

      <div>
        <div className="font-mono text-[10px] tracking-[.14em] uppercase text-muted mb-2">
          Application
        </div>
        <InstallCard />
      </div>

      <AppearanceSection />

      <div>
        <div className="font-mono text-[10px] tracking-[.14em] uppercase text-muted mb-2">
          Notifications
        </div>
        <div className="bg-surface border border-line rounded-card px-[14px]">
          <PushNotificationsToggle />
        </div>
      </div>

      <RemindersSection defaultReminders={prefs?.default_reminders ?? [30]} />

      <form action={signOut} className="mt-auto">
        <Button type="submit" variant="danger">
          Déconnexion
        </Button>
      </form>
    </div>
  );
}
