import type { ExerciseMeasure } from "@/lib/types";

export type SetRow = {
  reps: number | null;
  weight: number | null;
  duration_seconds: number | null;
  load_label: string | null;
};

export type SessionEntry = {
  id: string;
  exercise_id: string;
  exercise: { name: string; measure: ExerciseMeasure };
  per_side: boolean;
  notes: string | null;
  entry_sets: (SetRow & { set_number: number })[];
};

export type SessionWithEntries = {
  id: string;
  client_id: string;
  session_date: string;
  focus: string | null;
  notes: string | null;
  session_entries: SessionEntry[];
};

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}:${String(s).padStart(2, "0")}` : `${m} min`;
}

export function formatWeight(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(1);
}

const uniqueInOrder = <T,>(xs: T[]) => xs.filter((x, i) => xs.indexOf(x) === i);

/** Compact, human-readable summary of an exercise's sets, e.g. "2 × 12 @ 24 → 32 lb" or "2 × 40s". */
export function summarizeSets(sets: SetRow[], perSide = false): string {
  if (sets.length === 0) return "";
  const parts: string[] = [];

  const reps = sets.map((s) => s.reps).filter((r): r is number => r != null);
  const durations = sets.map((s) => s.duration_seconds).filter((d): d is number => d != null);

  if (durations.length) {
    const uniq = uniqueInOrder(durations);
    parts.push(uniq.length === 1 ? `${sets.length} × ${formatDuration(uniq[0])}` : durations.map(formatDuration).join(" → "));
  } else if (reps.length) {
    const uniq = uniqueInOrder(reps);
    parts.push(uniq.length === 1 ? `${sets.length} × ${uniq[0]}` : `${sets.length} sets · ${reps.join("/")} reps`);
  } else {
    parts.push(`${sets.length} ${sets.length === 1 ? "set" : "sets"}`);
  }
  if (perSide) parts[0] += " each side";

  const weights = uniqueInOrder(sets.map((s) => s.weight).filter((w): w is number => w != null));
  if (weights.length) parts.push(`@ ${weights.map(formatWeight).join(" → ")} lb`);

  const labels = uniqueInOrder(sets.map((s) => s.load_label).filter((l): l is string => !!l));
  if (labels.length) parts.push(labels.join(", "));
  return parts.join(" ");
}

export type EntryTotals = { topWeight: number | null; volume: number };

export function entryTotals(sets: SetRow[]): EntryTotals {
  const weights = sets.map((s) => s.weight).filter((w): w is number => w != null);
  return {
    topWeight: weights.length ? Math.max(...weights) : null,
    volume: sets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0),
  };
}

/** Guess how an exercise is measured from what was entered. */
export function inferMeasure(sets: SetRow[]): ExerciseMeasure {
  if (sets.some((s) => s.weight != null)) return "weight";
  if (sets.some((s) => s.duration_seconds != null)) return "duration";
  return "reps";
}
