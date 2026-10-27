import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, LineChart as LineChartIcon, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressChart } from "@/components/progress/progress-chart";
import { ProgressControls } from "@/components/progress/progress-controls";
import { getClient } from "@/lib/data/clients";
import { listClientExercises, listGoals, listProgressRows } from "@/lib/data/progress";
import { formatDate, todayISO } from "@/lib/dates";
import { METRIC_LABEL, availableMetrics, buildSeries, computeChange, defaultMetric, type Metric, type Range } from "@/lib/progress";
import { requireTrainer } from "@/lib/auth";

export const metadata: Metadata = { title: "Progress" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const RANGES: Range[] = ["1m", "3m", "6m", "all"];

export default async function ProgressPage({ params, searchParams }: PageProps<"/clients/[id]/progress">) {
  await requireTrainer();
  const { id } = await params;
  const sp = await searchParams;
  const client = await getClient(id);
  const [exercises, rows, goals] = await Promise.all([listClientExercises(id), listProgressRows(id), listGoals(id)]);

  if (exercises.length === 0) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed px-6 py-16 text-center">
        <LineChartIcon aria-hidden className="mb-4 size-8 text-muted-foreground" />
        <h2 className="text-xl">Progress appears after the first session</h2>
        <p className="mb-6 mt-2 max-w-sm text-muted-foreground">Log a workout with weights, reps or timed holds and each exercise gets its own trend line.</p>
        {!client.archived_at ? <Button asChild><Link href={`/clients/${id}/sessions/new`}><Plus /> Log session</Link></Button> : null}
      </div>
    );
  }

  const exercise = exercises.find((e) => e.id === first(sp.exercise)) ?? exercises[0];
  const metrics = availableMetrics(exercise.measure);
  const requested = first(sp.metric) as Metric | undefined;
  const metric = requested && metrics.includes(requested) ? requested : defaultMetric(exercise.measure);
  const rangeParam = first(sp.range) as Range | undefined;
  const range: Range = rangeParam && RANGES.includes(rangeParam) ? rangeParam : "3m";
  const today = todayISO();

  const exerciseRows = rows.filter((r) => r.exercise_id === exercise.id);
  const series = buildSeries(exerciseRows, metric, range, today);
  const change = computeChange(series);
  const target = metric === "top_weight" ? goals.find((g) => g.exercise_id === exercise.id && g.target_weight != null && !g.achieved_at)?.target_weight ?? null : null;
  const unit = METRIC_LABEL[metric];
  const Arrow = change?.direction === "up" ? ArrowUpRight : change?.direction === "down" ? ArrowDownRight : ArrowRight;

  return (
    <div className="max-w-4xl">
      <ProgressControls exercises={exercises} exerciseId={exercise.id} metrics={metrics} metric={metric} range={range} />

      <Card>
        <CardHeader>
          <CardTitle>{exercise.name} · {unit}</CardTitle>
          {change ? (
            <p className={`flex items-center gap-1 text-sm font-medium ${change.direction === "up" ? "text-success" : change.direction === "down" ? "text-warning" : "text-muted-foreground"}`}>
              <Arrow className="size-4" aria-hidden />
              {change.direction === "flat" ? "No change" : `${change.delta > 0 ? "+" : ""}${change.delta}`}
              {change.percent != null && change.direction !== "flat" ? ` (${change.percent > 0 ? "+" : ""}${change.percent}%)` : ""}
              <span className="font-normal text-muted-foreground"> since {formatDate(change.first.date, "MMM d")}</span>
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          {series.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No sessions with this measure in the selected range. Try a longer range.</p>
          ) : series.length === 1 ? (
            <div className="py-10 text-center">
              <p className="text-3xl">{series[0].value}</p>
              <p className="mt-1 text-muted-foreground">on {formatDate(series[0].date)}. One more session and a trend line will appear.</p>
            </div>
          ) : (
            <ProgressChart series={series} unitLabel={unit} target={target}
              ariaLabel={`${exercise.name} ${unit} over time: ${series.map((p) => `${formatDate(p.date)} ${p.value}`).join(", ")}`} />
          )}
        </CardContent>
      </Card>

      {change ? (
        <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
          {[["Starting", change.first.value], ["Latest", change.latest.value], ["Best", change.best]].map(([label, value]) => (
            <div key={label as string} className="rounded-lg border bg-card px-4 py-3 shadow-sm">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-xl font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {series.length > 0 ? (
        <details className="mt-6 rounded-lg border bg-card shadow-sm">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium">View the numbers</summary>
          <table className="w-full border-t text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground"><tr><th scope="col" className="px-4 py-2 font-medium">Date</th><th scope="col" className="px-4 py-2 text-right font-medium">{unit}</th></tr></thead>
            <tbody className="divide-y">
              {[...series].reverse().map((p) => (
                <tr key={p.sessionId}><td className="px-4 py-2">{formatDate(p.date)}</td><td className="px-4 py-2 text-right tabular-nums">{p.value}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}
    </div>
  );
}
