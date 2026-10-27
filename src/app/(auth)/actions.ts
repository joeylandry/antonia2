"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { forgotSchema, loginSchema, newPasswordSchema } from "@/lib/validation/auth";

export type AuthState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirm", string>>;
  message?: string;
  email?: string;
};

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: NonNullable<AuthState["fieldErrors"]> = {};
  for (const issue of issues) {
    const key = issue.path[0] as keyof typeof out;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues), email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // One generic message so the form never reveals which accounts exist.
    return { error: "That email and password don't match. Please try again.", email };
  }
  redirect(safeNext(formData.get("next")));
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues), email: String(formData.get("email") ?? "") };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/reset-password`,
  });
  // Same response whether or not the account exists.
  return { message: "If that email has an account, a reset link is on its way. It can take a minute to arrive." };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "This reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
