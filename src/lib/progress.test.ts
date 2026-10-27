import { describe, expect, it } from "vitest";
import { buildSeries, computeChange, goalProgress, type ProgressRow } from "./progress";

const row = (date: string, top_weight: number | null, volume = 0): ProgressRow => ({
  exercise_id: "e", session_id: `s-${date}`, session_date: date, top_weight, top_reps: 10, top_duration_seconds: null, volume, set_count: 2,
});

const rows = [row("2026-10-20", 30, 720), row("2026-08-01", 20, 480), row("2026-10-06", 24, 576), row("2026-10-09", null)];

describe("buildSeries", () => {
  it("sorts oldest first and skips sessions without the metric", () => {
    expect(buildSeries(rows, "top_weight", "all", "2026-10-27").map((p) => p.date)).toEqual(["2026-08-01", "2026-10-06", "2026-10-20"]);
  });
  it("limits to the date range counted back from today", () => {
    expect(buildSeries(rows, "top_weight", "1m", "2026-10-27").map((p) => p.date)).toEqual(["2026-10-06", "2026-10-20"]);
    expect(buildSeries(rows, "top_weight", "3m", "2026-10-27")).toHaveLength(3);
  });
  it("ignores zero-volume sessions for volume", () => {
    expect(buildSeries(rows, "volume", "all", "2026-10-27")).toHaveLength(3);
  });
});

describe("computeChange", () => {
  it("needs at least two points", () => {
    expect(computeChange([])).toBeNull();
    expect(computeChange(buildSeries([row("2026-10-06", 24)], "top_weight", "all", "2026-10-27"))).toBeNull();
  });
  it("reports delta, percent and best", () => {
    const c = computeChange(buildSeries(rows, "top_weight", "all", "2026-10-27"))!;
    expect(c).toMatchObject({ delta: 10, percent: 50, best: 30, direction: "up" });
  });
  it("reports declines and flat results", () => {
    const down = computeChange(buildSeries([row("2026-10-01", 30), row("2026-10-08", 25)], "top_weight", "all", "2026-10-27"))!;
    expect(down).toMatchObject({ delta: -5, direction: "down" });
    expect(computeChange(buildSeries([row("2026-10-01", 30), row("2026-10-08", 30)], "top_weight", "all", "2026-10-27"))!.direction).toBe("flat");
  });
});

describe("goalProgress", () => {
  const series = buildSeries(rows, "top_weight", "all", "2026-10-27");
  it("handles missing target and missing data", () => {
    expect(goalProgress({ target_weight: null, achieved_at: null }, series)).toEqual({ state: "no-target" });
    expect(goalProgress({ target_weight: 100, achieved_at: null }, [])).toEqual({ state: "no-data" });
  });
  it("computes the fraction between the first recorded weight and the target", () => {
    expect(goalProgress({ target_weight: 50, achieved_at: null }, series)).toMatchObject({ state: "in-progress", baseline: 20, current: 30, fraction: 1 / 3, remaining: 20 });
  });
  it("is achieved once any session reaches the target", () => {
    expect(goalProgress({ target_weight: 30, achieved_at: null }, series)).toEqual({ state: "achieved", current: 30 });
  });
});
