"use client";

import { useActionState, useState } from "react";
import { Mascot } from "@/components/icons/mascot";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AVATAR_OPTIONS } from "@/features/profile/avatars";
import { saveProfile, type SaveProfileState } from "@/features/profile/actions";

type CompleteProfileFormProps = {
  initialFullName: string;
  initialAvatarUrl: string | null;
};

const INITIAL_STATE: SaveProfileState = { error: null };

export function CompleteProfileForm({
  initialFullName,
  initialAvatarUrl,
}: CompleteProfileFormProps) {
  const [state, formAction, pending] = useActionState(saveProfile, INITIAL_STATE);
  const [avatarId, setAvatarId] = useState(
    AVATAR_OPTIONS.find((a) => a.src === initialAvatarUrl)?.id ?? AVATAR_OPTIONS[0]?.id ?? ""
  );
  const selectedAvatar = AVATAR_OPTIONS.find((a) => a.id === avatarId);

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col px-6 pt-6 pb-6 max-w-sm mx-auto w-full animate-plfade">
      <div className="flex justify-end mb-2">
        <ThemeToggle />
      </div>

      <div className="flex items-center gap-[11px]">
        <Mascot size={38} />
        <p className="text-[13.5px] text-ink-2 leading-[1.35]">
          Avant tout, faisons connaissance.
        </p>
      </div>
      <h1 className="font-serif text-[26px] tracking-[-.01em] mt-[18px] mb-1">
        Comment veux-tu qu&apos;on t&apos;appelle ?
      </h1>

      <form action={formAction} className="flex flex-col gap-[18px] mt-[22px]">
        <label className="flex flex-col gap-[7px]">
          <span className="font-mono text-[10px] tracking-[.12em] uppercase text-muted">
            Ton nom
          </span>
          <input
            autoFocus
            name="fullName"
            defaultValue={initialFullName}
            placeholder="Ton prénom, un surnom, ce que tu veux…"
            className="h-[50px] rounded-input border border-line bg-surface px-[15px] text-[15px] focus:border-accent focus:outline-none"
          />
        </label>

        <input type="hidden" name="avatarUrl" value={selectedAvatar?.src ?? ""} />

        <div>
          <span className="font-mono text-[10px] tracking-[.12em] uppercase text-muted">
            Choisis ton avatar
          </span>
          <div className="grid grid-cols-4 gap-[12px] mt-[10px] max-h-[260px] overflow-y-auto pr-1">
            {AVATAR_OPTIONS.map((avatar) => {
              const selected = avatar.id === avatarId;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setAvatarId(avatar.id)}
                  aria-label={avatar.label}
                  aria-pressed={selected}
                  className="rounded-full overflow-hidden aspect-square cursor-pointer"
                  style={{
                    boxShadow: selected
                      ? "0 0 0 2px var(--bg), 0 0 0 4px var(--accent)"
                      : "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- images locales simples */}
                  <img src={avatar.src} alt={avatar.label} className="w-full h-full" />
                </button>
              );
            })}
          </div>
        </div>

        {state.error && (
          <p role="alert" className="text-[13px] text-danger">
            {state.error}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "..." : "Continuer"}
        </Button>
      </form>
    </div>
  );
}
