"use server";

import { revalidatePath } from "next/cache";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveExercises } from "@/lib/data/exercises";
import { goalSchema } from "@/lib/validation/goal";
import { formToObject, zodFieldErrors } from "@/lib/validation/client";

export type GoalFormState = { errors?: Record<string, string>; error?: string; saved?: number };

async function toRow(clientId: string, data: ReturnType<typeof goalSchema.parse>) {
  let exercise_id: string | null = null;
  if (data.exercise_name) {
    const ids = await resolveExercises([{ name: data.exercise_name, measure: "weight" }]);
    exercise_id = ids.get(data.exercise_name.trim().toLowerCase()) ?? null;
  }
  return {
    client_id: clientId,
    title: data.title,
    exercise_id,
    target_weight: data.target_weight ?? null,
    target_date: data.target_date ?? null,
  };
}

export async function saveGoalAction(clientId: string, goalId: string | null, _prev: GoalFormState, formData: FormData): Promise<GoalFormState> {
  await requireTrainer();
  const parsed = goalSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: zodFieldErrors(parsed.error.issues) };

  try {
    const row = await toRow(clientId, parsed.data);
    const supabase = await createClient();
    const { error } = goalId
      ? await supabase.from("goals").update({ ...row, client_id: undefined }).eq("id", goalId).eq("client_id", clientId)
      : await supabase.from("goals").insert(row);
    if (error) return { error: "Could not save the goal. Please try again." };
  } catch {
    return { error: "Could not save the goal. Please try again." };
  }
  revalidatePath(`/clients/${clientId}/goals`);
  return { saved: Date.now() };
}

export async function setGoalAchievedAction(clientId: string, goalId: string, achieved: boolean) {
  await requireTrainer();
  const supabase = await createClient();
  const { error } = await supabase.from("goals").update({ achieved_at: achieved ? new Date().toISOString() : null }).eq("id", goalId).eq("client_id", clientId);
  if (error) throw new Error("Could not update the goal");
  revalidatePath(`/clients/${clientId}/goals`);
}

export async function deleteGoalAction(clientId: string, goalId: string) {
  await requireTrainer();
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", goalId).eq("client_id", clientId);
  if (error) throw new Error("Could not delete the goal");
  revalidatePath(`/clients/${clientId}/goals`);
}
