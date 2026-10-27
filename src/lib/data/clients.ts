import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CLIENT_STATUS_LABEL, CLIENT_TYPE_LABEL } from "@/lib/clients";
import type { Client, ClientOverview } from "@/lib/types";

export type ClientSort = "name" | "review" | "recent";
export type ClientFilters = { q?: string; status?: string; type?: string; archived?: boolean; sort?: ClientSort };

/** Characters that have meaning inside a PostgREST filter expression. */
function cleanSearch(q: string) {
  return q.replace(/[,()*%\\:"']/g, " ").trim().slice(0, 80);
}

export async function listClients(f: ClientFilters = {}): Promise<ClientOverview[]> {
  const supabase = await createClient();
  let query = supabase.from("client_overview").select("*");

  query = f.archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (f.status && f.status in CLIENT_STATUS_LABEL) query = query.eq("status", f.status);
  if (f.type && f.type in CLIENT_TYPE_LABEL) query = query.eq("client_type", f.type);
  const q = f.q ? cleanSearch(f.q) : "";
  if (q) query = query.or(`full_name.ilike.%${q}%,primary_focus.ilike.%${q}%`);

  if (f.sort === "review") query = query.order("next_review_date", { ascending: true, nullsFirst: false });
  else if (f.sort === "recent") query = query.order("last_session_date", { ascending: false, nullsFirst: false });
  query = query.order("full_name", { ascending: true });

  const { data, error } = await query;
  if (error) throw new Error(`Could not load clients: ${error.message}`);
  return (data ?? []) as ClientOverview[];
}

export async function getClient(id: string): Promise<Client> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load client: ${error.message}`);
  if (!data) notFound();
  return data as Client;
}

export async function countClients(): Promise<{ active: number; archived: number }> {
  const supabase = await createClient();
  const [a, b] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).is("archived_at", null),
    supabase.from("clients").select("id", { count: "exact", head: true }).not("archived_at", "is", null),
  ]);
  return { active: a.count ?? 0, archived: b.count ?? 0 };
}
