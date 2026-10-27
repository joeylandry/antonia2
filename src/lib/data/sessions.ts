import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Exercise } from "@/lib/types";
import type { SessionWithEntries } from "@/lib/sessions";

const SESSION_SELECT =
  "id, client_id, session_date, focus, notes, session_entries(id, exercise_id, per_side, notes, exercise:exercises(name, measure), entry_sets(set_number, reps, weight, duration_seconds, load_label))";

function sortNested(rows: SessionWithEntries[]): SessionWithEntries[] {
  return rows.map((s) => ({
    ...s,
    session_entries: s.session_entries.map((e) => ({
      ...e,
      entry_sets: [...e.entry_sets].sort((a, b) => a.set_number - b.set_number),
    })),
  }));
}

export async function listSessions(clientId: string, limit = 200): Promise<SessionWithEntries[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("client_id", clientId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "session_entries", ascending: true })
    .limit(limit);
  if (error) throw new Error(`Could not load sessions: ${error.message}`);
  return sortNested((data ?? []) as unknown as SessionWithEntries[]);
}

export async function getSession(clientId: string, sessionId: string): Promise<SessionWithEntries> {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("client_id", clientId)
    .eq("id", sessionId)
    .order("position", { referencedTable: "session_entries", ascending: true })
    .maybeSingle();
  if (error) throw new Error(`Could not load session: ${error.message}`);
  if (!data) notFound();
  return sortNested([data as unknown as SessionWithEntries])[0];
}

export async function listExercises(): Promise<Exercise[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("exercises").select("id, name, measure").order("name");
  if (error) throw new Error(`Could not load exercises: ${error.message}`);
  return (data ?? []) as Exercise[];
}
