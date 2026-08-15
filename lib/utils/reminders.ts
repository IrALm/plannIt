export type ReminderUnit = "minute" | "heure" | "jour";

export const REMINDER_UNITS: { value: ReminderUnit; label: string }[] = [
  { value: "minute", label: "min" },
  { value: "heure", label: "h" },
  { value: "jour", label: "j" },
];

export function toMinutes(amount: number, unit: ReminderUnit): number {
  switch (unit) {
    case "minute":
      return amount;
    case "heure":
      return amount * 60;
    case "jour":
      return amount * 1440;
  }
}

/** "45" → "45 min", "60" → "1 h", "90" → "1 h 30", "1440" → "1 j". */
export function formatReminderMinutes(minutes: number): string {
  if (minutes % 1440 === 0 && minutes >= 1440) return `${minutes / 1440} j`;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours} h` : `${hours} h ${rest}`;
  }
  return `${minutes} min`;
}
