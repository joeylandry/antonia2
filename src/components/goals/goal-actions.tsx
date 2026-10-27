"use client";

import { useTransition } from "react";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteGoalAction, setGoalAchievedAction } from "@/app/(app)/clients/[id]/goals/actions";

export function GoalActions({ clientId, goalId, achieved, title }: { clientId: string; goalId: string; achieved: boolean; title: string }) {
  const [pending, start] = useTransition();
  return (
    <>
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => start(() => setGoalAchievedAction(clientId, goalId, !achieved))}>
        {achieved ? <><RotateCcw /> Reopen</> : <><Check /> Mark achieved</>}
      </Button>
      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" disabled={pending} aria-label={`Delete goal: ${title}`}
        onClick={() => { if (window.confirm("Delete this goal?")) start(() => deleteGoalAction(clientId, goalId)); }}>
        <Trash2 />
      </Button>
    </>
  );
}
