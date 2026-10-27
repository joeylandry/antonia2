"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "../actions";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function ResetForm() {
  const [state, action] = useActionState<AuthState, FormData>(updatePassword, {});
  const f = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-md bg-destructive-subtle px-3 py-2 text-sm text-destructive">{state.error}</p>
      ) : null}
      <FormField label="New password" htmlFor="password" error={f.password} hint="At least 10 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" autoFocus
          aria-invalid={!!f.password} aria-describedby={f.password ? "password-error" : undefined} />
      </FormField>
      <FormField label="Confirm new password" htmlFor="confirm" error={f.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password"
          aria-invalid={!!f.confirm} aria-describedby={f.confirm ? "confirm-error" : undefined} />
      </FormField>
      <SubmitButton className="w-full" size="lg" pendingText="Saving…">Save password</SubmitButton>
    </form>
  );
}
