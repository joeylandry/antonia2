"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthState } from "../actions";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, {});
  const f = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {state.error ? (
        <p role="alert" className="rounded-md bg-destructive-subtle px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <FormField label="Email" htmlFor="email" error={f.email}>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} autoFocus
          aria-invalid={!!f.email} aria-describedby={f.email ? "email-error" : undefined} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={f.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password"
          aria-invalid={!!f.password} aria-describedby={f.password ? "password-error" : undefined} />
      </FormField>
      <SubmitButton className="w-full" size="lg" pendingText="Signing in…">Sign in</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/forgot-password" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
