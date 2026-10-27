"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FormField } from "@/components/form-field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { CLIENT_STATUS_LABEL, CLIENT_TYPE_LABEL } from "@/lib/clients";
import type { Client } from "@/lib/types";
import type { ClientFormState } from "@/app/(app)/clients/actions";

type Props = {
  action: (prev: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  client?: Client;
  cancelHref: string;
  submitLabel: string;
};

export function ClientForm({ action, client, cancelHref, submitLabel }: Props) {
  const [state, formAction] = useActionState<ClientFormState, FormData>(action, {});
  const e = state.errors ?? {};
  const v = (name: keyof Client, fallback = "") => state.values?.[name] ?? (client?.[name] != null ? String(client[name]) : fallback);
  const a11y = (name: string) => ({ "aria-invalid": !!e[name], "aria-describedby": e[name] ? `${name}-error` : undefined });

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-md bg-destructive-subtle px-3 py-2 text-sm text-destructive">{state.error}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Name" htmlFor="full_name" error={e.full_name} className="sm:col-span-2">
          <Input id="full_name" name="full_name" defaultValue={v("full_name")} autoComplete="off" autoFocus={!client} {...a11y("full_name")} />
        </FormField>
        <FormField label="Type" htmlFor="client_type" error={e.client_type}>
          <Select id="client_type" name="client_type" defaultValue={v("client_type", "personal_training")}>
            {Object.entries(CLIENT_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </FormField>
        <FormField label="Status" htmlFor="status" error={e.status}>
          <Select id="status" name="status" defaultValue={v("status", "active")}>
            {Object.entries(CLIENT_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </FormField>
        <FormField label="Primary goal / focus" htmlFor="primary_focus" error={e.primary_focus} className="sm:col-span-2"
          hint="For example: getting back into lifting heavy; bench press and squat.">
          <Textarea id="primary_focus" name="primary_focus" rows={2} defaultValue={v("primary_focus")} {...a11y("primary_focus")} />
        </FormField>
      </div>

      <fieldset className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-sm font-semibold">Schedule and reviews</legend>
        <FormField label="Session length (minutes)" htmlFor="session_length_minutes" error={e.session_length_minutes}>
          <Input id="session_length_minutes" name="session_length_minutes" inputMode="numeric" defaultValue={v("session_length_minutes")} {...a11y("session_length_minutes")} />
        </FormField>
        <FormField label="Sessions per week" htmlFor="sessions_per_week" error={e.sessions_per_week}>
          <Input id="sessions_per_week" name="sessions_per_week" inputMode="numeric" defaultValue={v("sessions_per_week")} {...a11y("sessions_per_week")} />
        </FormField>
        <FormField label="Assessment date" htmlFor="assessment_date" error={e.assessment_date}>
          <Input id="assessment_date" name="assessment_date" type="date" defaultValue={v("assessment_date")} {...a11y("assessment_date")} />
        </FormField>
        <FormField label="Next review" htmlFor="next_review_date" error={e.next_review_date}>
          <Input id="next_review_date" name="next_review_date" type="date" defaultValue={v("next_review_date")} {...a11y("next_review_date")} />
        </FormField>
        <FormField label="Training start date" htmlFor="start_date" error={e.start_date}>
          <Input id="start_date" name="start_date" type="date" defaultValue={v("start_date")} {...a11y("start_date")} />
        </FormField>
      </fieldset>

      <FormField label="Notes" htmlFor="notes" error={e.notes} hint="Injuries, preferences, anything worth remembering.">
        <Textarea id="notes" name="notes" rows={5} defaultValue={v("notes")} {...a11y("notes")} />
      </FormField>

      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
        <Button asChild variant="ghost"><Link href={cancelHref}>Cancel</Link></Button>
      </div>
    </form>
  );
}
