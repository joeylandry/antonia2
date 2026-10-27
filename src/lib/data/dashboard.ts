import "server-only";
import { createClient } from "@/lib/supabase/server";

export type DueGoal = { id: string; title: string; target_date: string; client_id: string; client_name: string };
export type RecentSession = { id: string; session_date: string; focus: string | null; client_id: string; client_name: string; exercise_count: number };

type Named = { full_name: string; archived_at: string | null } | { full_name: string; archived_at: string | null }[] | null;
const one = (n: Named) => (Array.isArray(n) ? n[0] : n);

export async function listGoalsDueBy(date: string): Promise<DueGoal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("id, title, target_date, client_id, clients(full_name, archived_at)")
    .is("achieved_at", null)
    .not("target_date", "is", null)
    .lte("target_date", date)
    .order("target_date", { ascending: true })
    .limit(20);
  if (error) throw new Error(`Could not load goals: ${error.message}`);
  return (data ?? []).flatMap((g) => {
    const c = one(g.clients as Named);
    return c && !c.archived_at ? [{ id: g.id, title: g.title, target_date: g.target_date as string, client_id: g.client_id, client_name: c.full_name }] : [];
  });
}

export async function listRecentSessions(limit = 6): Promise<RecentSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("id, session_date, focus, client_id, clients(full_name, archived_at), session_entries(count)")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load sessions: ${error.message}`);
  return (data ?? []).flatMap((s) => {
    const c = one(s.clients as Named);
    const count = (s.session_entries as unknown as { count: number }[] | null)?.[0]?.count ?? 0;
    return c ? [{ id: s.id, session_date: s.session_date, focus: s.focus, client_id: s.client_id, client_name: c.full_name, exercise_count: count }] : [];
  });
}
