import { describe, expect, it } from "vitest";
import { entryTotals, formatDuration, inferMeasure, summarizeSets } from "./sessions";

const set = (reps: number | null, weight: number | null = null, duration_seconds: number | null = null, load_label: string | null = null) => ({
  reps, weight, duration_seconds, load_label,
});

describe("summarizeSets", () => {
  it("collapses identical reps and shows a weight progression", () => {
    expect(summarizeSets([set(12, 24), set(12, 32)])).toBe("2 × 12 @ 24 → 32 lb");
  });
  it("shows a single weight once", () => {
    expect(summarizeSets([set(12, 15), set(12, 15)])).toBe("2 × 12 @ 15 lb");
  });
  it("lists differing reps", () => {
    expect(summarizeSets([set(12, 25), set(10, 25), set(5, 55)])).toBe("3 sets · 12/10/5 reps @ 25 → 55 lb");
  });
  it("handles timed holds, per-side work and band labels", () => {
    expect(summarizeSets([set(null, null, 20), set(null, null, 40)])).toBe("20s → 40s");
    expect(summarizeSets([set(null, null, 40), set(null, null, 40)])).toBe("2 × 40s");
    expect(summarizeSets([set(12, 9)], true)).toBe("1 × 12 each side @ 9 lb");
    expect(summarizeSets([set(8, null, null, "orange band"), set(8, null, null, "orange band")])).toBe("2 × 8 orange band");
  });
  it("is empty for no sets", () => expect(summarizeSets([])).toBe(""));
});

describe("entryTotals", () => {
  it("computes top weight and volume, ignoring unweighted sets", () => {
    expect(entryTotals([set(12, 24), set(12, 32), set(10, null)])).toEqual({ topWeight: 32, volume: 12 * 24 + 12 * 32 });
    expect(entryTotals([set(10)])).toEqual({ topWeight: null, volume: 0 });
  });
});

describe("inferMeasure / formatDuration", () => {
  it("prefers weight, then duration, then reps", () => {
    expect(inferMeasure([set(10, 20)])).toBe("weight");
    expect(inferMeasure([set(null, null, 30)])).toBe("duration");
    expect(inferMeasure([set(10)])).toBe("reps");
  });
  it("formats durations", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(90)).toBe("1:30");
    expect(formatDuration(120)).toBe("2 min");
  });
});
