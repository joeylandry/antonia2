import { daysBetween } from "@/lib/dates";
import type { Goal } from "@/lib/types";

export type ProgressRow = {
  exercise_id: string;
  session_id: string;
  session_date: string;
  top_weight: number | null;
  top_reps: number | null;
  top_duration_seconds: number | null;
  volume: number;
  set_count: number;
};

export type Metric = "top_weight" | "volume" | "top_reps" | "top_duration_seconds";
export type Range = "1m" | "3m" | "6m" | "all";

export const METRIC_LABEL: Record<Metric, string> = {
  top_weight: "Top weight (lb)",
  volume: "Volume (lb × reps)",
  top_reps: "Best set (reps)",
  top_duration_seconds: "Longest hold (seconds)",
};

export const RANGE_DAYS: Record<Exclude<Range, "all">, number> = { "1m": 30, "3m": 91, "6m": 182 };

export type Point = { date: string; value: number; sessionId: string };

/** One point per session for the chosen metric, oldest first, limited to the date range ending today. */
export function buildSeries(rows: ProgressRow[], metric: Metric, range: Range, today: string): Point[] {
  return rows
    .filter((r) => r[metric] != null && (metric !== "volume" || r.volume > 0))
    .filter((r) => range === "all" || daysBetween(r.session_date, today) <= RANGE_DAYS[range])
    .map((r) => ({ date: r.session_date, value: Number(r[metric]), sessionId: r.session_id }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export type Change = {
  first: Point;
  latest: Point;
  best: number;
  delta: number;
  percent: number | null;
  direction: "up" | "down" | "flat";
};

/** Compares the latest point with the first point in the series (the baseline for the selected range). */
export function computeChange(series: Point[]): Change | null {
  if (series.length < 2) return null;
  const first = series[0];
  const latest = series[series.length - 1];
  const delta = Math.round((latest.value - first.value) * 10) / 10;
  return {
    first,
    latest,
    best: Math.max(...series.map((p) => p.value)),
    delta,
    percent: first.value === 0 ? null : Math.round((delta / first.value) * 1000) / 10,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
}

export type GoalProgress =
  | { state: "no-target" }
  | { state: "no-data" }
  | { state: "achieved"; current: number }
  | { state: "in-progress"; current: number; baseline: number; fraction: number; remaining: number };

/** Progress of a weight target for one exercise, from the all-time series of top weights. */
export function goalProgress(goal: Pick<Goal, "target_weight" | "achieved_at">, topWeights: Point[]): GoalProgress {
  if (goal.target_weight == null) return { state: "no-target" };
  if (topWeights.length === 0) return { state: "no-data" };
  const best = Math.max(...topWeights.map((p) => p.value));
  if (best >= goal.target_weight) return { state: "achieved", current: best };
  const baseline = topWeights[0].value;
  const span = goal.target_weight - baseline;
  const fraction = span <= 0 ? 0 : Math.min(1, Math.max(0, (best - baseline) / span));
  return { state: "in-progress", current: best, baseline, fraction, remaining: goal.target_weight - best };
}

export function defaultMetric(measure: "weight" | "reps" | "duration"): Metric {
  return measure === "weight" ? "top_weight" : measure === "duration" ? "top_duration_seconds" : "top_reps";
}

export function availableMetrics(measure: "weight" | "reps" | "duration"): Metric[] {
  return measure === "weight" ? ["top_weight", "volume", "top_reps"] : measure === "duration" ? ["top_duration_seconds"] : ["top_reps"];
}
