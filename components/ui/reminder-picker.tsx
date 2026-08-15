"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  formatReminderMinutes,
  toMinutes,
  REMINDER_UNITS,
  type ReminderUnit,
} from "@/lib/utils/reminders";

type ReminderPickerProps = {
  value: number[];
  onChange: (next: number[]) => void;
};

/**
 * Liste libre de rappels (n'importe quelle valeur, en minutes/heures/jours),
 * pas limitée à des presets fixes — partagée entre le modal d'événement et
 * les réglages (rappels par défaut).
 */
export function ReminderPicker({ value, onChange }: ReminderPickerProps) {
  const [adding, setAdding] = useState(false);
  // Champ libre (pas un number contrôlé/clampé) : sinon vider l'input pour
  // taper une nouvelle valeur le fait retomber sur 1 à chaque frappe, ce qui
  // empêchait de saisir autre chose qu'un nombre commençant par 1.
  const [amountInput, setAmountInput] = useState("15");
  const [unit, setUnit] = useState<ReminderUnit>("minute");

  const sorted = [...value].sort((a, b) => a - b);

  function remove(minutes: number) {
    onChange(value.filter((m) => m !== minutes));
  }

  function submitNew() {
    const amount = parseInt(amountInput, 10);
    if (!amount || amount < 1) return;

    const minutes = toMinutes(amount, unit);
    if (minutes > 0 && !value.includes(minutes)) {
      onChange([...value, minutes]);
    }
    setAmountInput("15");
    setUnit("minute");
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex flex-wrap gap-[9px]">
        {sorted.map((minutes) => (
          <span
            key={minutes}
            className="inline-flex items-center gap-[6px] rounded-pill border border-accent bg-tint px-[13px] py-2 text-[12.5px] font-medium text-ink"
          >
            {formatReminderMinutes(minutes)} avant
            <button
              type="button"
              aria-label="Retirer ce rappel"
              onClick={() => remove(minutes)}
              className="text-ink-2 cursor-pointer"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-[7px] px-[13px] py-[9px] rounded-pill border border-dashed border-line text-ink-2 text-[13.5px] font-medium cursor-pointer"
          >
            <Plus size={14} />
            Ajouter
          </button>
        )}
      </div>

      {adding && (
        <div className="flex items-center gap-2 bg-surface border border-line rounded-card p-[10px]">
          <input
            autoFocus
            type="number"
            min={1}
            inputMode="numeric"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNew();
            }}
            className="w-16 h-9 rounded-input border border-line bg-bg px-2 text-[13.5px] font-mono focus:border-accent focus:outline-none"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as ReminderUnit)}
            className="h-9 rounded-input border border-line bg-bg px-2 text-[13.5px] focus:border-accent focus:outline-none"
          >
            {REMINDER_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
          <span className="text-[12.5px] text-muted">avant</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="h-9 px-3 rounded-input border border-line text-[13px] cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submitNew}
            className="h-9 px-3 rounded-input bg-accent text-accent-ink text-[13px] font-semibold cursor-pointer"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
