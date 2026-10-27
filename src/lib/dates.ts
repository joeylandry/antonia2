import { format, parseISO, differenceInCalendarDays } from "date-fns";

/** "Today" as YYYY-MM-DD in the trainer's timezone (server clocks run in UTC). */
export function todayISO(now: Date = new Date(), timeZone = process.env.APP_TIMEZONE ?? "America/New_York"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Calendar days from `from` to `to` (both YYYY-MM-DD); positive when `to` is later. */
export function daysBetween(from: string, to: string): number {
  return differenceInCalendarDays(parseISO(to), parseISO(from));
}

export function formatDate(iso: string | null | undefined, pattern = "MMM d, yyyy"): string {
  return iso ? format(parseISO(iso), pattern) : "—";
}

export function formatShortDate(iso: string | null | undefined, today: string): string {
  if (!iso) return "—";
  const sameYear = iso.slice(0, 4) === today.slice(0, 4);
  return format(parseISO(iso), sameYear ? "MMM d" : "MMM d, yyyy");
}

export function relativeDays(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}
