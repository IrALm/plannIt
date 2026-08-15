"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updateProfileName, updateProfileAvatar } from "@/app/settings/actions";
import { AVATAR_OPTIONS } from "@/features/profile/avatars";

type ProfileSectionProps = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

export function ProfileSection({ name, email, avatarUrl }: ProfileSectionProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [pending, startTransition] = useTransition();
  const initial = (value || email)[0]?.toUpperCase() ?? "?";

  function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      await updateProfileName(trimmed);
      setEditing(false);
    });
  }

  function pickAvatar(src: string) {
    setCurrentAvatar(src);
    setPickingAvatar(false);
    startTransition(async () => {
      await updateProfileAvatar(src);
    });
  }

  return (
    <div>
      <div className="font-mono text-[10px] tracking-[.14em] uppercase text-muted mb-2">
        Profil
      </div>
      <div className="flex items-center gap-3 bg-surface border border-line rounded-card p-[13px]">
        <button
          type="button"
          onClick={() => setPickingAvatar((v) => !v)}
          aria-label="Changer d'avatar"
          className="size-11 rounded-full bg-tint flex items-center justify-center font-serif text-[19px] text-accent shrink-0 overflow-hidden cursor-pointer"
        >
          {currentAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- SVG local simple
            <img src={currentAvatar} alt="Ton avatar" className="w-full h-full" />
          ) : (
            initial
          )}
        </button>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="w-full h-8 rounded-input border border-line bg-bg px-2 text-[14.5px] focus:border-accent focus:outline-none"
              disabled={pending}
            />
          ) : (
            <div className="text-[14.5px] font-semibold truncate">{value || "Sans nom"}</div>
          )}
          <div className="font-mono text-[11.5px] text-muted mt-0.5 truncate">{email}</div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-ink-2 shrink-0 cursor-pointer"
            aria-label="Modifier le nom"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      {pickingAvatar && (
        <div className="grid grid-cols-6 gap-[10px] mt-3 max-h-[200px] overflow-y-auto pr-1">
          {AVATAR_OPTIONS.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => pickAvatar(avatar.src)}
              aria-label={avatar.label}
              aria-pressed={avatar.src === currentAvatar}
              className="rounded-full overflow-hidden aspect-square cursor-pointer"
              style={{
                boxShadow:
                  avatar.src === currentAvatar
                    ? "0 0 0 2px var(--bg), 0 0 0 4px var(--accent)"
                    : "none",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG local simple */}
              <img src={avatar.src} alt={avatar.label} className="w-full h-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
