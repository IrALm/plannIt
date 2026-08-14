"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updateProfileName } from "@/app/settings/actions";

type ProfileSectionProps = {
  name: string;
  email: string;
};

export function ProfileSection({ name, email }: ProfileSectionProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
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

  return (
    <div>
      <div className="font-mono text-[10px] tracking-[.14em] uppercase text-muted mb-2">
        Profil
      </div>
      <div className="flex items-center gap-3 bg-surface border border-line rounded-card p-[13px]">
        <div className="size-11 rounded-full bg-tint flex items-center justify-center font-serif text-[19px] text-accent shrink-0">
          {initial}
        </div>
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
    </div>
  );
}
