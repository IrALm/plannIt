"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Mascot } from "@/components/icons/mascot";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { EVENT_COLOR_HEX, EVENT_COLORS } from "@/features/calendar/types";
import type { EventColor } from "@/lib/supabase/types";

export type SelectedType = { name: string; color: EventColor; selected: boolean };

type StepTypesProps = {
  types: SelectedType[];
  onToggle: (name: string) => void;
  onAddCustom: (name: string, color: EventColor) => void;
};

export function StepTypes({ types, onToggle, onAddCustom }: StepTypesProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<EventColor>("blue");

  function submitNew() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddCustom(trimmed, newColor);
    setNewName("");
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-center gap-[11px]">
        <Mascot size={38} />
        <p className="text-[13.5px] text-ink-2">Personnalise, c&apos;est TON planning.</p>
      </div>
      <h1 className="font-serif text-[23px] mt-0.5">Tes types d&apos;activité</h1>
      <p className="text-[13px] text-ink-2">
        Choisis-en quelques-uns, tu pourras en ajouter plus tard.
      </p>

      <div className="flex flex-wrap gap-[9px] mt-0.5">
        {types.map((t) => (
          <ToggleChip
            key={t.name}
            label={t.name}
            dotColor={EVENT_COLOR_HEX[t.color]}
            selected={t.selected}
            onClick={() => onToggle(t.name)}
          />
        ))}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-[7px] px-[13px] py-[9px] rounded-pill border border-dashed border-line text-ink-2 text-[13.5px] font-medium cursor-pointer"
          >
            <Plus size={14} />
            Nouveau
          </button>
        )}
      </div>

      {adding && (
        <div className="flex flex-col gap-[10px] bg-surface border border-line rounded-card p-[13px] mt-1">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom du type"
            className="h-11 rounded-input border border-line bg-bg px-3 text-[14px] focus:border-accent focus:outline-none"
          />
          <div className="flex gap-[11px]">
            {EVENT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setNewColor(c)}
                className="size-7 rounded-chip cursor-pointer"
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="flex-1 h-9 rounded-input border border-line text-[13px] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submitNew}
              className="flex-1 h-9 rounded-input bg-accent text-accent-ink text-[13px] font-semibold cursor-pointer"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
