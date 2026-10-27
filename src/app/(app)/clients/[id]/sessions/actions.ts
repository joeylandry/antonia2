"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveExercises } from "@/lib/data/exercises";
import { inferMeasure } from "@/lib/sessions";
import { isBlankSet, sessionSchema } from "@/lib/validation/session";
import { zodFieldErrors } from "@/lib/validation/client";

export type SessionFormState = { error?: string; errors?: Record<string, string> };

export async function saveSessionAction(_prev: SessionFormState, formData: FormData): Promise<SessionFormState> {
  await requireTrainer();

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "Something went wrong reading the form. Please try again." };
  }
  const parsed = sessionSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = zodFieldErrors(parsed.error.issues);
    return { error: Object.values(errors)[0] ?? "Please check the form.", errors };
  }
  const p = parsed.data;

  const entries = p.entries.map((e) => ({ ...e, sets: e.sets.filter((s) => !isBlankSet(s)) }));
  const empty = entries.findIndex((e) => e.sets.length === 0 && !e.notes);
  if (empty >= 0) return { error: `Exercise ${empty + 1} (${entries[empty].name}) has no sets or notes. Add a set or remove it.` };

  try {
    const ids = await resolveExercises(entries.map((e) => ({ name: e.name, measure: e.sets.length ? inferMeasure(e.sets) : e.measure })));
    const supabase = await createClient();
    const { error } = await supabase.rpc("save_session", {
      p_session_id: p.session_id,
      p_client_id: p.client_id,
      p_session_date: p.session_date,
      p_focus: p.focus,
      p_notes: p.notes,
      p_entries: entries.map((e) => ({
        exercise_id: ids.get(e.name.trim().toLowerCase()),
        per_side: e.per_side,
        notes: e.notes,
        sets: e.sets,
      })),
    });
    if (error) return { error: "Could not save the session. Your entries are still on screen. Please try again." };
  } catch {
    return { error: "Could not save the session. Your entries are still on screen. Please try again." };
  }

  revalidatePath(`/clients/${p.client_id}`, "layout");
  revalidatePath("/");
  redirect(`/clients/${p.client_id}/sessions`);
}

export async function deleteSessionAction(clientId: string, sessionId: string) {
  await requireTrainer();
  const supabase = await createClient();
  const { error } = await supabase.from("sessions").delete().eq("id", sessionId).eq("client_id", clientId);
  if (error) throw new Error("Could not delete the session");
  revalidatePath(`/clients/${clientId}`, "layout");
  revalidatePath("/");
  redirect(`/clients/${clientId}/sessions`);
}
