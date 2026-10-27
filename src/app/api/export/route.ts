import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Downloads everything the signed-in trainer owns as JSON. Row-level security scopes every query. */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const [clients, exercises, goals, sessions] = await Promise.all([
    supabase.from("clients").select("*").order("full_name"),
    supabase.from("exercises").select("*").order("name"),
    supabase.from("goals").select("*").order("created_at"),
    supabase
      .from("sessions")
      .select("*, session_entries(*, entry_sets(*))")
      .order("session_date")
      .order("position", { referencedTable: "session_entries" }),
  ]);
  const failed = [clients, exercises, goals, sessions].find((r) => r.error);
  if (failed) return NextResponse.json({ error: "Export failed" }, { status: 500 });

  const body = { exported_at: new Date().toISOString(), version: 1, clients: clients.data, exercises: exercises.data, goals: goals.data, sessions: sessions.data };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="antonia-training-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
