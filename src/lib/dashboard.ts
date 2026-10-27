import { daysBetween } from "@/lib/dates";
import { reviewState } from "@/lib/clients";
import type { ClientOverview } from "@/lib/types";

export const INACTIVITY_DAYS = 14;
export const GOAL_WINDOW_DAYS = 14;

export type Attention = {
  reviews: { client: ClientOverview; kind: "overdue" | "soon"; days: number }[];
  quiet: { client: ClientOverview; daysSince: number | null }[];
  prospects: ClientOverview[];
};

/** What needs Antonia's attention today, from the active (non-archived) client list. */
export function buildAttention(clients: ClientOverview[], today: string): Attention {
  const live = clients.filter((c) => !c.archived_at);

  const reviews = live
    .filter((c) => c.status === "active" || c.status === "prospect")
    .flatMap((client) => {
      const s = reviewState(client.next_review_date, today);
      return s.kind === "overdue" || s.kind === "soon" ? [{ client, kind: s.kind, days: s.days }] : [];
    })
    .sort((a, b) => a.days - b.days);

  // Active personal-training clients with no session for two weeks (or none ever, once they've started).
  const quiet = live
    .filter((c) => c.status === "active" && c.client_type === "personal_training")
    .flatMap<{ client: ClientOverview; daysSince: number | null }>((client) => {
      if (client.last_session_date) {
        const daysSince = daysBetween(client.last_session_date, today);
        return daysSince >= INACTIVITY_DAYS ? [{ client, daysSince }] : [];
      }
      const startedAgo = client.start_date ? daysBetween(client.start_date, today) : null;
      return startedAgo != null && startedAgo >= 0 ? [{ client, daysSince: null }] : [];
    })
    .sort((a, b) => (b.daysSince ?? Infinity) - (a.daysSince ?? Infinity));

  const prospects = live.filter((c) => c.status === "prospect").sort((a, b) => (a.assessment_date ?? "") < (b.assessment_date ?? "") ? 1 : -1);

  return { reviews, quiet, prospects };
}

export function greeting(now: Date, timeZone: string): string {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(now));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}
