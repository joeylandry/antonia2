import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Exercise, Goal } from "@/lib/types";
import type { ProgressRow } from "@/lib/progress";

export async function listProgressRows(clientId: string): Promise<ProgressRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_progress")
    .select("exercise_id, session_id, session_date, top_weight, top_reps, top_duration_seconds, volume, set_count")
    .eq("client_id", clientId)
    .order("session_date", { ascending: true });
  if (error) throw new Error(`Could not load progress: ${error.message}`);
  return (data ?? []).map((r) => ({
    ...r,
    top_weight: r.top_weight == null ? null : Number(r.top_weight),
    volume: Number(r.volume),
  })) as ProgressRow[];
}

export async function listGoals(clientId: string): Promise<Goal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("id, client_id, title, exercise_id, target_weight, target_date, achieved_at, created_at")
    .eq("client_id", clientId)
    .order("achieved_at", { ascending: true, nullsFirst: true })
    .order("target_date", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`Could not load goals: ${error.message}`);
  return (data ?? []).map((g) => ({ ...g, target_weight: g.target_weight == null ? null : Number(g.target_weight) })) as Goal[];
}

/** Exercises that appear in this client's history, most-recently-used first. */
export async function listClientExercises(clientId: string): Promise<(Exercise & { last_date: string })[]> {
  const supabase = await createClient();
  const rows = await listProgressRows(clientId);
  const last = new Map<string, string>();
  for (const r of rows) if (!last.has(r.exercise_id) || r.session_date > last.get(r.exercise_id)!) last.set(r.exercise_id, r.session_date);
  if (last.size === 0) return [];
  const { data, error } = await supabase.from("exercises").select("id, name, measure").in("id", [...last.keys()]);
  if (error) throw new Error(`Could not load exercises: ${error.message}`);
  return ((data ?? []) as Exercise[]).map((e) => ({ ...e, last_date: last.get(e.id)! })).sort((a, b) => (a.last_date < b.last_date ? 1 : -1));
}
