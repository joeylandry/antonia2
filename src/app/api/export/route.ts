import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/data/paginate";

/** Downloads everything the signed-in trainer owns as JSON. Row-level security scopes every query. */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let clients, exercises, goals, sessions;
  try {
    [clients, exercises, goals, sessions] = await Promise.all([
      fetchAll((from, to) => supabase.from("clients").select("*").order("full_name").order("id").range(from, to)),
      fetchAll((from, to) => supabase.from("exercises").select("*").order("name").order("id").range(from, to)),
      fetchAll((from, to) => supabase.from("goals").select("*").order("created_at").order("id").range(from, to)),
      fetchAll((from, to) =>
        supabase.from("sessions").select("*, session_entries(*, entry_sets(*))").order("session_date").order("id").range(from, to),
      ),
    ]);
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }

  const body = { exported_at: new Date().toISOString(), version: 1, clients, exercises, goals, sessions };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="antonia-training-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
