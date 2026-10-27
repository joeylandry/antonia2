import type { ExerciseMeasure } from "@/lib/types";
import type { SessionWithEntries } from "@/lib/sessions";

export type SetDraft = { key: string; reps: string; weight: string; secs: string; label: string };
export type EntryDraft = { key: string; name: string; measure: ExerciseMeasure; perSide: boolean; notes: string; sets: SetDraft[] };
export type FormDraft = { date: string; focus: string; notes: string; entries: EntryDraft[] };

let counter = 0;
export const newKey = () => `k${++counter}`;
export const blankSet = (): SetDraft => ({ key: newKey(), reps: "", weight: "", secs: "", label: "" });
export const blankEntry = (): EntryDraft => ({ key: newKey(), name: "", measure: "weight", perSide: false, notes: "", sets: [blankSet(), blankSet()] });

const str = (n: number | null) => (n == null ? "" : String(n));

export function entriesFromSession(s: SessionWithEntries, { keepNotes }: { keepNotes: boolean }): EntryDraft[] {
  return s.session_entries.map((e) => ({
    key: newKey(),
    name: e.exercise.name,
    measure: e.exercise.measure,
    perSide: e.per_side,
    notes: keepNotes ? (e.notes ?? "") : "",
    sets: e.entry_sets.map((x) => ({ key: newKey(), reps: str(x.reps), weight: str(x.weight), secs: str(x.duration_seconds), label: x.load_label ?? "" })),
  }));
}

export function draftFromSession(s: SessionWithEntries): FormDraft {
  return { date: s.session_date, focus: s.focus ?? "", notes: s.notes ?? "", entries: entriesFromSession(s, { keepNotes: true }) };
}
