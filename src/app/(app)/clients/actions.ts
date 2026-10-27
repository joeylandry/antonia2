"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { clientSchema, formToObject, zodFieldErrors } from "@/lib/validation/client";

export type ClientFormState = { errors?: Record<string, string>; values?: Record<string, string>; error?: string };

function valuesOf(formData: FormData) {
  return Object.fromEntries(Object.entries(formToObject(formData)).map(([k, v]) => [k, String(v)]));
}

function toRow(input: ReturnType<typeof clientSchema.parse>) {
  return {
    full_name: input.full_name,
    client_type: input.client_type,
    status: input.status,
    session_length_minutes: input.session_length_minutes ?? null,
    sessions_per_week: input.sessions_per_week ?? null,
    start_date: input.start_date ?? null,
    assessment_date: input.assessment_date ?? null,
    next_review_date: input.next_review_date ?? null,
    primary_focus: input.primary_focus ?? null,
    notes: input.notes ?? null,
  };
}

export async function createClientAction(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  await requireTrainer();
  const values = valuesOf(formData);
  const parsed = clientSchema.safeParse(values);
  if (!parsed.success) return { errors: zodFieldErrors(parsed.error.issues), values };

  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").insert(toRow(parsed.data)).select("id").single();
  if (error) return { error: "Could not save the client. Please try again.", values };
  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientAction(id: string, _prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  await requireTrainer();
  const values = valuesOf(formData);
  const parsed = clientSchema.safeParse(values);
  if (!parsed.success) return { errors: zodFieldErrors(parsed.error.issues), values };

  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: "Could not save your changes. Please try again.", values };
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

export async function setArchivedAction(id: string, archived: boolean) {
  await requireTrainer();
  const supabase = await createClient();
  const patch = archived ? { archived_at: new Date().toISOString(), status: "inactive" as const } : { archived_at: null, status: "active" as const };
  const { error } = await supabase.from("clients").update(patch).eq("id", id);
  if (error) throw new Error("Could not update the client");
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(archived ? "/clients" : `/clients/${id}`);
}

/** Permanent delete. Only archived clients can be deleted, and only after typing their name in the UI. */
export async function deleteClientAction(id: string, confirmName: string) {
  await requireTrainer();
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("full_name, archived_at").eq("id", id).maybeSingle();
  if (!client || !client.archived_at || client.full_name.trim().toLowerCase() !== confirmName.trim().toLowerCase()) {
    throw new Error("Confirmation did not match");
  }
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error("Could not delete the client");
  revalidatePath("/clients");
  redirect("/clients");
}
