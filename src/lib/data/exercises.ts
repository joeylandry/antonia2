import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ExerciseMeasure } from "@/lib/types";

/** Finds each exercise by name (case-insensitive) or creates it, so history always groups correctly.
 *  Returns a map from lower-cased name to exercise id. */
export async function resolveExercises(names: { name: string; measure: ExerciseMeasure }[]): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data: existing, error } = await supabase.from("exercises").select("id, name");
  if (error) throw new Error("Could not load exercises");
  const byName = new Map((existing ?? []).map((e) => [e.name.trim().toLowerCase(), e.id as string]));

  for (const { name, measure } of names) {
    const key = name.trim().toLowerCase();
    if (byName.has(key)) continue;
    const { data, error: insertError } = await supabase.from("exercises").insert({ name: name.trim(), measure }).select("id").single();
    if (insertError) throw new Error("Could not create exercise");
    byName.set(key, data.id);
  }
  return byName;
}
