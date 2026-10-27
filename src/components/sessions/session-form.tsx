"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Copy, Plus, Trash2, X } from "lucide-react";
import { FormField } from "@/components/form-field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { saveSessionAction, type SessionFormState } from "@/app/(app)/clients/[id]/sessions/actions";
import type { ExerciseMeasure } from "@/lib/types";
import { blankEntry, blankSet, newKey, type EntryDraft, type FormDraft, type SetDraft } from "@/lib/session-draft";

export type ExerciseOption = { name: string; measure: ExerciseMeasure };
export type LastTime = { date: string; summary: string };

type Props = {
  clientId: string;
  sessionId: string | null;
  initial: FormDraft;
  /** Entries from the client's most recent session, used by "Start from last session". */
  template: EntryDraft[] | null;
  templateDate: string | null;
  exercises: ExerciseOption[];
  focusOptions: string[];
  /** Lower-cased exercise name -> what the client did last time. */
  lastTime: Record<string, LastTime>;
  cancelHref: string;
  onDelete?: React.ReactNode;
};

function toNumber(raw: string): number | null | "invalid" {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : "invalid";
}

function buildPayload(clientId: string, sessionId: string | null, d: FormDraft) {
  return {
    client_id: clientId,
    session_id: sessionId,
    session_date: d.date,
    focus: d.focus.trim() || null,
    notes: d.notes.trim() || null,
    entries: d.entries.map((e) => ({
      name: e.name,
      measure: e.measure,
      per_side: e.perSide,
      notes: e.notes.trim() || null,
      sets: e.sets.map((s) => ({
        reps: e.measure === "duration" ? null : toNumber(s.reps),
        weight: e.measure === "weight" ? toNumber(s.weight) : null,
        duration_seconds: e.measure === "duration" ? toNumber(s.secs) : null,
        load_label: e.measure === "weight" ? s.label.trim() || null : null,
      })),
    })),
  };
}

function validate(d: FormDraft): string | null {
  if (!d.date) return "Choose the session date.";
  if (d.entries.length === 0) return "Add at least one exercise.";
  for (const [i, e] of d.entries.entries()) {
    if (!e.name.trim()) return `Exercise ${i + 1} needs a name.`;
    for (const s of e.sets) {
      for (const raw of [s.reps, s.weight, s.secs]) {
        const n = toNumber(raw);
        if (n === "invalid" || (typeof n === "number" && n < 0)) return `${e.name || `Exercise ${i + 1}`}: use plain positive numbers for reps, weight and time.`;
      }
    }
  }
  return null;
}

const MEASURE_LABEL: Record<ExerciseMeasure, string> = { weight: "Reps & weight", reps: "Reps only", duration: "Timed" };

export function SessionForm({ clientId, sessionId, initial, template, templateDate, exercises, focusOptions, lastTime, cancelHref, onDelete }: Props) {
  const [state, formAction] = useActionState<SessionFormState, FormData>(saveSessionAction, {});
  const [draft, setDraft] = useState<FormDraft>(initial);
  const [clientError, setClientError] = useState<string | null>(null);
  const dirty = useRef(false);
  const lastAdded = useRef<string | null>(null);

  const payload = useMemo(() => JSON.stringify(buildPayload(clientId, sessionId, draft)), [clientId, sessionId, draft]);
  const exerciseByName = useMemo(() => new Map(exercises.map((e) => [e.name.trim().toLowerCase(), e])), [exercises]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    if (lastAdded.current) {
      document.getElementById(`name-${lastAdded.current}`)?.focus();
      lastAdded.current = null;
    }
  }, [draft.entries.length]);

  function change(next: FormDraft | ((d: FormDraft) => FormDraft)) {
    dirty.current = true;
    setClientError(null);
    setDraft(next);
  }

  const updateEntry = (key: string, patch: Partial<EntryDraft>) =>
    change((d) => ({ ...d, entries: d.entries.map((e) => (e.key === key ? { ...e, ...patch } : e)) }));

  const updateSet = (entryKey: string, setKey: string, patch: Partial<SetDraft>) =>
    change((d) => ({
      ...d,
      entries: d.entries.map((e) => (e.key === entryKey ? { ...e, sets: e.sets.map((s) => (s.key === setKey ? { ...s, ...patch } : s)) } : e)),
    }));

  function pickName(entry: EntryDraft, name: string) {
    const known = exerciseByName.get(name.trim().toLowerCase());
    updateEntry(entry.key, { name, ...(known ? { measure: known.measure } : {}) });
  }

  function addEntry() {
    const e = blankEntry();
    lastAdded.current = e.key;
    change((d) => ({ ...d, entries: [...d.entries, e] }));
  }

  function addSet(entry: EntryDraft) {
    const last = entry.sets[entry.sets.length - 1];
    const copy: SetDraft = last ? { ...last, key: newKey() } : blankSet();
    updateEntry(entry.key, { sets: [...entry.sets, copy] });
  }

  function useTemplate() {
    if (!template) return;
    change((d) => ({
      ...d,
      focus: d.focus || initial.focus,
      entries: template.map((e) => ({ ...e, key: newKey(), notes: "", sets: e.sets.map((s) => ({ ...s, key: newKey() })) })),
    }));
  }

  const showError = clientError ?? state.error;
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (showError) errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [showError]);
  const hasBlankStart = draft.entries.every((e) => !e.name.trim() && e.sets.every((x) => !x.reps && !x.weight && !x.secs && !x.label));

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={(e) => {
        const problem = validate(draft);
        if (problem) {
          e.preventDefault();
          setClientError(problem);
          return;
        }
        dirty.current = false;
      }}
      onKeyDown={(e) => {
        // Enter in a single-line field should not submit a long form by accident.
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault();
      }}
      className="space-y-8"
    >
      <input type="hidden" name="payload" value={payload} />

      {showError ? (
        <p ref={errorRef} role="alert" className="rounded-md bg-destructive-subtle px-3 py-2 text-sm text-destructive">{showError}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[11rem_1fr]">
        <FormField label="Date" htmlFor="session_date">
          <Input id="session_date" type="date" value={draft.date} onChange={(e) => change((d) => ({ ...d, date: e.target.value }))} />
        </FormField>
        <FormField label="Workout focus" htmlFor="focus">
          <Input id="focus" list="focus-options" placeholder="e.g. Lower body" value={draft.focus} onChange={(e) => change((d) => ({ ...d, focus: e.target.value }))} autoComplete="off" />
          <datalist id="focus-options">{focusOptions.map((f) => <option key={f} value={f} />)}</datalist>
        </FormField>
      </div>

      {template && hasBlankStart ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-subtle px-4 py-3">
          <p className="text-sm text-muted-foreground">Repeat the exercises and loads from the last session{templateDate ? ` (${templateDate})` : ""} and adjust as you go.</p>
          <Button type="button" variant="secondary" size="sm" onClick={useTemplate}><Copy /> Start from last session</Button>
        </div>
      ) : null}

      <datalist id="exercise-options">{exercises.map((e) => <option key={e.name} value={e.name} />)}</datalist>

      <ol className="space-y-5">
        {draft.entries.map((entry, index) => {
          const last = lastTime[entry.name.trim().toLowerCase()];
          const cols = entry.measure === "weight" ? "grid-cols-[1.25rem_1fr_1fr_1.4fr_2rem]" : "grid-cols-[1.25rem_1fr_2rem]";
          return (
            <li key={entry.key} className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="min-w-0 flex-[1_1_12rem]">
                  <label htmlFor={`name-${entry.key}`} className="sr-only">Exercise {index + 1}</label>
                  <Input id={`name-${entry.key}`} list="exercise-options" placeholder={`Exercise ${index + 1}`} value={entry.name} autoComplete="off"
                    onChange={(e) => pickName(entry, e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor={`measure-${entry.key}`} className="sr-only">How exercise {index + 1} is measured</label>
                  <Select id={`measure-${entry.key}`} className="w-auto min-w-36" value={entry.measure} onChange={(e) => updateEntry(entry.key, { measure: e.target.value as ExerciseMeasure })}>
                    {Object.entries(MEASURE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remove exercise ${index + 1}`}
                    onClick={() => change((d) => ({ ...d, entries: d.entries.filter((x) => x.key !== entry.key) }))}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
              {last ? <p className="mt-1.5 text-xs text-muted-foreground">Last time ({last.date}): {last.summary}</p> : null}

              <div className={`mt-4 grid ${cols} items-center gap-x-2 gap-y-2`}>
                <span />
                {entry.measure !== "duration" ? <span className="text-xs text-muted-foreground">Reps</span> : <span className="text-xs text-muted-foreground">Seconds</span>}
                {entry.measure === "weight" ? <span className="text-xs text-muted-foreground">Weight (lb)</span> : null}
                {entry.measure === "weight" ? <span className="text-xs text-muted-foreground">Band / note</span> : null}
                <span />
                {entry.sets.map((s, si) => (
                  <SetRowFields key={s.key} index={si} entry={entry} set={s}
                    onChange={(patch) => updateSet(entry.key, s.key, patch)}
                    onRemove={() => updateEntry(entry.key, { sets: entry.sets.filter((x) => x.key !== s.key) })} />
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => addSet(entry)}><Plus /> Add set</Button>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={entry.perSide} onChange={(e) => updateEntry(entry.key, { perSide: e.target.checked })} />
                  Each side
                </label>
              </div>

              <Textarea aria-label={`Notes for exercise ${index + 1}`} rows={2} className="mt-3 min-h-0" placeholder="Notes / progress: cues, form, why the load changed…"
                value={entry.notes} onChange={(e) => updateEntry(entry.key, { notes: e.target.value })} />
            </li>
          );
        })}
      </ol>

      <Button type="button" variant="secondary" onClick={addEntry}><Plus /> Add exercise</Button>

      <FormField label="Session notes" htmlFor="session_notes" hint="Optional. Anything about the session as a whole.">
        <Textarea id="session_notes" rows={3} value={draft.notes} onChange={(e) => change((d) => ({ ...d, notes: e.target.value }))} />
      </FormField>

      <div className="sticky bottom-16 -mx-4 flex items-center gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 md:bottom-0">
        <SubmitButton pendingText="Saving…">{sessionId ? "Save changes" : "Save session"}</SubmitButton>
        <Button asChild variant="ghost"><Link href={cancelHref}>Cancel</Link></Button>
        <div className="ml-auto">{onDelete}</div>
      </div>
    </form>
  );
}

function SetRowFields({ index, entry, set, onChange, onRemove }: {
  index: number; entry: EntryDraft; set: SetDraft; onChange: (p: Partial<SetDraft>) => void; onRemove: () => void;
}) {
  const label = (what: string) => `${what}, set ${index + 1}`;
  return (
    <>
      <span aria-hidden className="text-sm text-muted-foreground">{index + 1}</span>
      {entry.measure === "duration" ? (
        <Input aria-label={label("Seconds")} inputMode="numeric" value={set.secs} onChange={(e) => onChange({ secs: e.target.value })} />
      ) : (
        <Input aria-label={label("Reps")} inputMode="numeric" value={set.reps} onChange={(e) => onChange({ reps: e.target.value })} />
      )}
      {entry.measure === "weight" ? <Input aria-label={label("Weight in pounds")} inputMode="decimal" value={set.weight} onChange={(e) => onChange({ weight: e.target.value })} /> : null}
      {entry.measure === "weight" ? <Input aria-label={label("Band or note")} placeholder="optional" value={set.label} onChange={(e) => onChange({ label: e.target.value })} /> : null}
      <Button type="button" variant="ghost" size="icon" className="size-8" aria-label={`Remove set ${index + 1}`} onClick={onRemove}><X /></Button>
    </>
  );
}
