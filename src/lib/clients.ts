import { daysBetween } from "@/lib/dates";
import type { Client, ClientStatus, ClientType } from "@/lib/types";

export const CLIENT_TYPE_LABEL: Record<ClientType, string> = {
  personal_training: "Personal training",
  fitness_assessment: "Fitness assessment",
};

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  prospect: "Prospect",
  active: "Active",
  on_hold: "On hold",
  inactive: "Inactive",
};

export const STATUS_TONE: Record<ClientStatus, "success" | "accent" | "warning" | "neutral"> = {
  active: "success",
  prospect: "accent",
  on_hold: "warning",
  inactive: "neutral",
};

export type ReviewState = { kind: "none" } | { kind: "overdue" | "soon" | "later"; days: number };

/** Whether a client's next review needs attention. "soon" means within a week. */
export function reviewState(nextReview: string | null, today: string): ReviewState {
  if (!nextReview) return { kind: "none" };
  const days = daysBetween(today, nextReview);
  if (days < 0) return { kind: "overdue", days };
  if (days <= 7) return { kind: "soon", days };
  return { kind: "later", days };
}

export function scheduleLabel(c: Pick<Client, "session_length_minutes" | "sessions_per_week">): string | null {
  const parts: string[] = [];
  if (c.session_length_minutes) parts.push(`${c.session_length_minutes} min`);
  if (c.sessions_per_week) parts.push(`${c.sessions_per_week}×/week`);
  return parts.length ? parts.join(" · ") : null;
}
