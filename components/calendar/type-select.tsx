"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { EVENT_COLOR_HEX, EVENT_COLORS, type EventType } from "@/features/calendar/types";
import type { EventColor } from "@/lib/supabase/types";

type TypeSelectProps = {
  types: EventType[];
  value: string | null;
  onChange: (id: string) => void;
  onCreateType: (name: string, color: EventColor, weatherSensitive: boolean) => Promise<EventType>;
};

export function TypeSelect({ types, value, onChange, onCreateType }: TypeSelectProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<EventColor>("blue");
  const [weatherSensitive, setWeatherSensitive] = useState(false);

  const selected = types.find((t) => t.id === value);

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const created = await onCreateType(trimmed, newColor, weatherSensitive);
    onChange(created.id);
    setNewName("");
    setWeatherSensitive(false);
    setCreating(false);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-[10px] bg-surface border border-line rounded-card px-[13px] py-[12px] cursor-pointer"
      >
        {selected && (
          <span
            className="size-[9px] rounded-full shrink-0"
            style={{ background: EVENT_COLOR_HEX[selected.color] }}
          />
        )}
        <span className="flex-1 text-left text-[14.5px] truncate">
          {selected?.name ?? "Choisir un type"}
        </span>
        <ChevronDown size={16} className="text-muted shrink-0" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-surface border border-line rounded-card shadow-card overflow-hidden">
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onChange(t.id);
                setOpen(false);
              }}
              className="w-full flex items-center gap-[10px] px-[13px] py-[10px] hover:bg-surface-2 text-left cursor-pointer"
            >
              <span
                className="size-[9px] rounded-full shrink-0"
                style={{ background: EVENT_COLOR_HEX[t.color] }}
              />
              <span className="text-[14px]">{t.name}</span>
            </button>
          ))}

          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-[13px] py-[10px] text-ink-2 text-[13.5px] border-t border-line cursor-pointer"
            >
              <Plus size={14} /> Nouveau type
            </button>
          ) : (
            <div className="flex flex-col gap-2 p-[13px] border-t border-line">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom du type"
                className="h-9 rounded-input border border-line bg-bg px-3 text-[13.5px] focus:border-accent focus:outline-none"
              />
              <div className="flex gap-2">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    onClick={() => setNewColor(c)}
                    className="size-6 rounded-chip cursor-pointer"
                    style={{
                      background: EVENT_COLOR_HEX[c],
                      boxShadow:
                        newColor === c
                          ? "0 0 0 2px var(--bg), 0 0 0 4px var(--accent)"
                          : "none",
                    }}
                  />
                ))}
              </div>
              <label className="flex items-center gap-[7px] text-[12.5px] text-ink-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={weatherSensitive}
                  onChange={(e) => setWeatherSensitive(e.target.checked)}
                  className="accent-accent"
                />
                Sensible à la météo (alerte si pluie prévue)
              </label>
              <button
                type="button"
                onClick={handleCreate}
                className="h-8 rounded-input bg-accent text-accent-ink text-[12.5px] font-semibold cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
