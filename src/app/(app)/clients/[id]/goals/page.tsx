import type { Metadata } from "next";
import { Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GoalActions } from "@/components/goals/goal-actions";
import { GoalDialog } from "@/components/goals/goal-dialog";
import { getClient } from "@/lib/data/clients";
import { listGoals, listProgressRows } from "@/lib/data/progress";
import { listExercises } from "@/lib/data/sessions";
import { daysBetween, formatDate, relativeDays, todayISO } from "@/lib/dates";
import { buildSeries, goalProgress } from "@/lib/progress";
import { requireTrainer } from "@/lib/auth";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage({ params }: PageProps<"/clients/[id]/goals">) {
  await requireTrainer();
  const { id } = await params;
  const client = await getClient(id);
  const [goals, rows, exercises] = await Promise.all([listGoals(id), listProgressRows(id), listExercises()]);
  const nameById = new Map(exercises.map((e) => [e.id, e.name]));
  const today = todayISO();
  const names = exercises.map((e) => e.name);

  return (
    <div className="max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-muted-foreground">{client.primary_focus ? <>Overall focus: {client.primary_focus}</> : "Set specific, dated targets for this client."}</p>
        {!client.archived_at ? <GoalDialog clientId={id} exerciseNames={names} /> : null}
      </div>

      {goals.length === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed px-6 py-14 text-center">
          <Target aria-hidden className="mb-4 size-8 text-muted-foreground" />
          <h2 className="text-xl">No goals yet</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">Try a measurable target such as “Squat 180 lb by October 31” and progress will fill in as sessions are logged.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {goals.map((g) => {
            const exerciseName = g.exercise_id ? nameById.get(g.exercise_id) ?? null : null;
            const series = g.exercise_id ? buildSeries(rows.filter((r) => r.exercise_id === g.exercise_id), "top_weight", "all", today) : [];
            const progress = goalProgress(g, series);
            const done = Boolean(g.achieved_at) || progress.state === "achieved";
            const dueIn = g.target_date ? daysBetween(today, g.target_date) : null;
            return (
              <li key={g.id}>
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-sans text-base font-semibold">{g.title}</h3>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {exerciseName && g.target_weight ? <span>{exerciseName} · {g.target_weight} lb</span> : null}
                        {g.target_date ? <span>Due {formatDate(g.target_date)}</span> : null}
                        {g.achieved_at ? <Badge tone="success">Achieved {formatDate(g.achieved_at.slice(0, 10))}</Badge>
                          : progress.state === "achieved" ? <Badge tone="success">Target reached</Badge>
                          : dueIn != null && dueIn < 0 ? <Badge tone="danger">Overdue · {relativeDays(dueIn)}</Badge>
                          : dueIn != null && dueIn <= 14 ? <Badge tone="warning">Due {relativeDays(dueIn)}</Badge> : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <GoalDialog clientId={id} exerciseNames={names} goal={{ ...g, exercise_name: exerciseName }} />
                    </div>
                  </div>

                  {progress.state === "in-progress" || progress.state === "achieved" ? (
                    <div className="mt-4">
                      <div role="progressbar" aria-label={`Progress toward ${g.title}`} aria-valuemin={0} aria-valuemax={100}
                        aria-valuenow={Math.round((progress.state === "achieved" ? 1 : progress.fraction) * 100)} className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${done ? "bg-success" : "bg-primary"}`} style={{ width: `${(progress.state === "achieved" ? 1 : progress.fraction) * 100}%` }} />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {progress.state === "achieved" ? `Best so far: ${progress.current} lb` : `Best so far: ${progress.current} lb · ${progress.remaining} lb to go (started at ${progress.baseline} lb)`}
                      </p>
                    </div>
                  ) : progress.state === "no-data" ? (
                    <p className="mt-3 text-sm text-muted-foreground">No sessions logged for {exerciseName} yet.</p>
                  ) : null}

                  <div className="mt-3 flex items-center justify-end gap-1 border-t pt-3">
                    <GoalActions clientId={id} goalId={g.id} achieved={Boolean(g.achieved_at)} title={g.title} />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
