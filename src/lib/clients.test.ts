import { describe, expect, it } from "vitest";
import { reviewState, scheduleLabel } from "./clients";
import { clientSchema } from "./validation/client";
import { todayISO } from "./dates";

describe("reviewState", () => {
  it("flags overdue, soon and later reviews relative to today", () => {
    expect(reviewState(null, "2026-10-27")).toEqual({ kind: "none" });
    expect(reviewState("2026-10-26", "2026-10-27")).toEqual({ kind: "overdue", days: -1 });
    expect(reviewState("2026-10-27", "2026-10-27")).toEqual({ kind: "soon", days: 0 });
    expect(reviewState("2026-11-03", "2026-10-27")).toEqual({ kind: "soon", days: 7 });
    expect(reviewState("2026-11-04", "2026-10-27")).toEqual({ kind: "later", days: 8 });
  });
});

describe("scheduleLabel", () => {
  it("joins length and frequency, and is null when neither is set", () => {
    expect(scheduleLabel({ session_length_minutes: 30, sessions_per_week: 2 })).toBe("30 min · 2×/week");
    expect(scheduleLabel({ session_length_minutes: null, sessions_per_week: 1 })).toBe("1×/week");
    expect(scheduleLabel({ session_length_minutes: null, sessions_per_week: null })).toBeNull();
  });
});

describe("todayISO", () => {
  it("uses the configured timezone rather than UTC", () => {
    const lateUtc = new Date("2026-10-28T02:30:00Z");
    expect(todayISO(lateUtc, "America/New_York")).toBe("2026-10-27");
    expect(todayISO(lateUtc, "UTC")).toBe("2026-10-28");
  });
});

describe("clientSchema", () => {
  const base = { full_name: "  Jo  ", client_type: "personal_training", status: "active" };
  it("trims the name and treats blank optional fields as absent", () => {
    const r = clientSchema.parse({ ...base, session_length_minutes: "", next_review_date: "", primary_focus: "  " });
    expect(r.full_name).toBe("Jo");
    expect(r.session_length_minutes).toBeUndefined();
    expect(r.next_review_date).toBeUndefined();
    expect(r.primary_focus).toBeUndefined();
  });
  it("coerces numbers and rejects out-of-range or impossible values", () => {
    expect(clientSchema.parse({ ...base, session_length_minutes: "30", sessions_per_week: "2" })).toMatchObject({
      session_length_minutes: 30,
      sessions_per_week: 2,
    });
    expect(clientSchema.safeParse({ ...base, session_length_minutes: "2" }).success).toBe(false);
    expect(clientSchema.safeParse({ ...base, sessions_per_week: "1.5" }).success).toBe(false);
    expect(clientSchema.safeParse({ ...base, next_review_date: "2026-02-30" }).success).toBe(false);
    expect(clientSchema.safeParse({ ...base, full_name: "   " }).success).toBe(false);
  });
});

describe("date validation", () => {
  it("rejects impossible calendar dates in sessions and goals", async () => {
    const { sessionSchema } = await import("./validation/session");
    const { goalSchema } = await import("./validation/goal");
    const entry = { name: "Squat", measure: "weight", per_side: false, notes: null, sets: [] };
    const base = { client_id: "11111111-1111-4111-8111-111111111111", session_id: null, focus: null, notes: null, entries: [entry] };
    expect(sessionSchema.safeParse({ ...base, session_date: "2026-02-31" }).success).toBe(false);
    expect(sessionSchema.safeParse({ ...base, session_date: "2026-13-45" }).success).toBe(false);
    expect(sessionSchema.safeParse({ ...base, session_date: "2026-02-28" }).success).toBe(true);
    expect(goalSchema.safeParse({ title: "x", target_date: "2026-02-31" }).success).toBe(false);
  });
});
