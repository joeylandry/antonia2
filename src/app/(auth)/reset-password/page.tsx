import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetForm } from "./reset-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  // The emailed link signs the user in via /auth/confirm; without that session there is nothing to reset.
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/forgot-password?expired=1");

  return (
    <>
      <h1 className="text-3xl">Choose a new password</h1>
      <p className="mb-8 mt-2 text-muted-foreground">You&apos;ll be signed in once it&apos;s saved.</p>
      <ResetForm />
    </>
  );
}
