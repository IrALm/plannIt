import { startOfWeek, endOfWeek, addDays, format } from "date-fns";
import { fr } from "date-fns/locale";

export function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
}

export function getWeekDays(date: Date): Date[] {
  const { start } = getWeekRange(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** "L", "M", "M", "J", "V", "S", "D" */
export function formatDayLetter(date: Date): string {
  return format(date, "EEEEE", { locale: fr }).toUpperCase();
}

/** "JEU. 15 JANVIER" — la locale fr fournit déjà le point après le jour abrégé. */
export function formatHeaderDate(date: Date): string {
  return format(date, "EEE d MMMM", { locale: fr }).toUpperCase();
}

export function formatTime(iso: string): string {
  return format(new Date(iso), "HH:mm");
}

/** "jeu 15 janv. · 08:30 → 09:30" — utilisé dans les emails transactionnels. */
export function formatEventWhenLabel(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  return `${format(start, "EEE d MMM", { locale: fr })} · ${formatTime(startISO)} → ${formatTime(endISO)}`;
}
