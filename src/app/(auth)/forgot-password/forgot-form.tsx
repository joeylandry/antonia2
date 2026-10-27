"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthState } from "../actions";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function ForgotForm({ expired }: { expired: boolean }) {
  const [state, action] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  const f = state.fieldErrors ?? {};
  if (state.message) {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-md bg-success-subtle px-3 py-2 text-sm text-success">{state.message}</p>
        <Link href="/login" className="text-sm text-primary underline-offset-4 hover:underline">Back to sign in</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      {expired ? (
        <p role="alert" className="rounded-md bg-warning-subtle px-3 py-2 text-sm text-warning">
          That reset link has expired or was already used. Request a new one below.
        </p>
      ) : null}
      <FormField label="Email" htmlFor="email" error={f.email}>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} autoFocus
          aria-invalid={!!f.email} aria-describedby={f.email ? "email-error" : undefined} />
      </FormField>
      <SubmitButton className="w-full" size="lg" pendingText="Sending…">Send reset link</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
