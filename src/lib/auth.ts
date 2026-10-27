import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Trainer = { id: string; email: string; displayName: string };

/** The authenticated trainer for this request, verified with Supabase Auth, or a redirect to /login.
 *  Call this in every protected page, layout and server action. */
export const requireTrainer = cache(async (): Promise<Trainer> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("trainer_profiles")
    .select("display_name")
    .eq("id", data.user.id)
    .maybeSingle();

  return { id: data.user.id, email: data.user.email ?? "", displayName: profile?.display_name ?? "" };
});

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNext(value: FormDataEntryValue | string | null | undefined): string {
  if (typeof value !== "string" || !value.startsWith("/") || /[\u0000-\u0020\u007f\\]/.test(value)) return "/";
  // Resolve like a browser would: anything that leaves this origin (e.g. "//host") is rejected.
  try {
    const url = new URL(value, "http://local.invalid");
    return url.origin === "http://local.invalid" ? url.pathname + url.search + url.hash : "/";
  } catch {
    return "/";
  }
}
