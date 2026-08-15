import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  eachDayOfInterval,
} from "date-fns";
import { fr } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

// App mono-utilisateur, en français, pour un usage en France — fuseau fixe
// plutôt que détection par visiteur (pas de vrai bénéfice pour un seul
// utilisateur, et ça évite la complexité d'un cookie de fuseau à synchroniser
// avec le serveur). À changer ici si l'usage devient multi-fuseaux un jour.
export const APP_TIME_ZONE = "Europe/Paris";

/**
 * "Aujourd'hui" à Paris, en yyyy-MM-dd — fiable même exécuté sur un serveur
 * dont l'horloge système n'est pas à l'heure de Paris (Vercel tourne ses
 * fonctions en UTC) : sans ça, un `new Date()` côté serveur peut désigner
 * "hier" ou "demain" par rapport au jour réel à Paris pendant la fenêtre où
 * les deux fuseaux ne sont pas encore/plus alignés (jusqu'à ~2h autour de
 * minuit, selon l'heure d'été).
 *
 * Volontairement une simple string, pas un objet Date : un Date "recalé" sur
 * un fuseau puis sérialisé (.toISOString()) et relu ailleurs se décale une
 * deuxième fois dès que l'environnement de lecture n'a pas le même fuseau
 * ambiant que celui de création — la string évite ce piège en confiant le
 * parsing final à l'environnement qui l'utilise réellement (le navigateur).
 */
export function todayYMD(): string {
  return formatInTimeZone(new Date(), APP_TIME_ZONE, "yyyy-MM-dd");
}

/**
 * Convertit une date "calendrier" locale (on ne garde que l'intention Y/M/D
 * /H/M/S, peu importe le fuseau dans lequel l'objet Date a été construit) en
 * le véritable instant UTC correspondant à cette heure-là à Paris —
 * nécessaire avant d'interroger Supabase (colonnes timestamptz, stockées en
 * UTC), sinon les bornes de plage seraient décalées de l'offset Paris/UTC
 * (1h ou 2h selon l'heure d'été).
 */
export function toAppTimeZoneInstant(date: Date): Date {
  return fromZonedTime(date, APP_TIME_ZONE);
}

export function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
}

export function getWeekDays(date: Date): Date[] {
  const { start } = getWeekRange(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Bornes de la grille mois affichée : le mois entier, complété jusqu'au
 * lundi/dimanche de ses semaines de bord (6 lignes de 7 jours en général). */
export function getMonthGridRange(date: Date) {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return { start, end };
}

export function getMonthGridDays(date: Date): Date[] {
  const { start, end } = getMonthGridRange(date);
  return eachDayOfInterval({ start, end });
}

/** "août 2026" */
export function formatMonthLabel(date: Date): string {
  return formatInTimeZone(date, APP_TIME_ZONE, "MMMM yyyy", { locale: fr });
}

/** "L", "M", "M", "J", "V", "S", "D" */
export function formatDayLetter(date: Date): string {
  return formatInTimeZone(date, APP_TIME_ZONE, "EEEEE", { locale: fr }).toUpperCase();
}

/** "JEU. 15 JANVIER" — la locale fr fournit déjà le point après le jour abrégé. */
export function formatHeaderDate(date: Date): string {
  return formatInTimeZone(date, APP_TIME_ZONE, "EEE d MMMM", { locale: fr }).toUpperCase();
}

export function formatTime(iso: string): string {
  return formatInTimeZone(new Date(iso), APP_TIME_ZONE, "HH:mm");
}

/** "jeu 15 janv. · 08:30 → 09:30" — utilisé dans les emails transactionnels. */
export function formatEventWhenLabel(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const dayLabel = formatInTimeZone(start, APP_TIME_ZONE, "EEE d MMM", { locale: fr });
  return `${dayLabel} · ${formatTime(startISO)} → ${formatTime(endISO)}`;
}
