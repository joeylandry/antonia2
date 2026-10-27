"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { saveGoalAction, type GoalFormState } from "@/app/(app)/clients/[id]/goals/actions";
import type { Goal } from "@/lib/types";

type Props = { clientId: string; exerciseNames: string[]; goal?: Goal & { exercise_name: string | null } };

export function GoalDialog({ clientId, exerciseNames, goal }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {goal ? <Button variant="ghost" size="sm" aria-label={`Edit goal: ${goal.title}`}><Pencil /> Edit</Button> : <Button><Plus /> Add goal</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogTitle>{goal ? "Edit goal" : "New goal"}</DialogTitle>
        <DialogDescription>Add a target weight to track progress automatically from logged sessions.</DialogDescription>
        {open ? <GoalForm clientId={clientId} exerciseNames={exerciseNames} goal={goal} onSaved={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function GoalForm({ clientId, exerciseNames, goal, onSaved }: Props & { onSaved: () => void }) {
  const [state, action] = useActionState<GoalFormState, FormData>(saveGoalAction.bind(null, clientId, goal?.id ?? null), {});
  const e = state.errors ?? {};
  useEffect(() => {
    if (state.saved) onSaved();
  }, [state.saved, onSaved]);
  const a11y = (n: string) => ({ "aria-invalid": !!e[n], "aria-describedby": e[n] ? `${n}-error` : undefined });

  return (
    <form action={action} noValidate className="mt-5 space-y-4">
      {state.error ? <p role="alert" className="rounded-md bg-destructive-subtle px-3 py-2 text-sm text-destructive">{state.error}</p> : null}
      <FormField label="Goal" htmlFor="title" error={e.title}>
        <Input id="title" name="title" defaultValue={goal?.title} placeholder="e.g. Squat 180 by end of October" autoFocus {...a11y("title")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Exercise (optional)" htmlFor="exercise_name" error={e.exercise_name}>
          <Input id="exercise_name" name="exercise_name" list="goal-exercises" defaultValue={goal?.exercise_name ?? ""} autoComplete="off" {...a11y("exercise_name")} />
          <datalist id="goal-exercises">{exerciseNames.map((n) => <option key={n} value={n} />)}</datalist>
        </FormField>
        <FormField label="Target weight (lb)" htmlFor="target_weight" error={e.target_weight}>
          <Input id="target_weight" name="target_weight" inputMode="decimal" defaultValue={goal?.target_weight ?? ""} {...a11y("target_weight")} />
        </FormField>
      </div>
      <FormField label="Target date (optional)" htmlFor="target_date" error={e.target_date}>
        <Input id="target_date" name="target_date" type="date" defaultValue={goal?.target_date ?? ""} {...a11y("target_date")} />
      </FormField>
      <div className="flex justify-end pt-2"><SubmitButton pendingText="Saving…">{goal ? "Save goal" : "Add goal"}</SubmitButton></div>
    </form>
  );
}
