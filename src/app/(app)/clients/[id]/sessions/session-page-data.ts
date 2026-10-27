import "server-only";
import { listExercises, listSessions } from "@/lib/data/sessions";
import { entriesFromSession } from "@/lib/session-draft";
import { formatDate } from "@/lib/dates";
import { summarizeSets } from "@/lib/sessions";
import type { LastTime } from "@/components/sessions/session-form";

const DEFAULT_FOCUS = ["Upper body", "Lower body", "Full body", "Core & mobility"];

/** Everything the session form needs besides the session being edited. */
export async function loadSessionFormData(clientId: string, excludeSessionId?: string) {
  const [exercises, all] = await Promise.all([listExercises(), listSessions(clientId, 30)]);
  const sessions = all.filter((s) => s.id !== excludeSessionId);

  const lastTime: Record<string, LastTime> = {};
  for (const s of sessions) {
    for (const e of s.session_entries) {
      const key = e.exercise.name.trim().toLowerCase();
      if (!lastTime[key]) lastTime[key] = { date: formatDate(s.session_date, "MMM d"), summary: summarizeSets(e.entry_sets, e.per_side) };
    }
  }
  const focusOptions = [...new Set([...sessions.map((s) => s.focus).filter((f): f is string => !!f), ...DEFAULT_FOCUS])];
  const latest = sessions[0];
  return {
    exercises: exercises.map((e) => ({ name: e.name, measure: e.measure })),
    lastTime,
    focusOptions,
    template: latest ? entriesFromSession(latest, { keepNotes: false }) : null,
    templateDate: latest ? formatDate(latest.session_date, "MMM d") : null,
  };
}
