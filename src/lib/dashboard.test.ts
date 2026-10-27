import { describe, expect, it } from "vitest";
import { buildAttention, greeting } from "./dashboard";
import type { ClientOverview } from "./types";

const base: ClientOverview = {
  id: "1", full_name: "A", client_type: "personal_training", status: "active", session_length_minutes: null, sessions_per_week: null,
  start_date: null, assessment_date: null, next_review_date: null, primary_focus: null, notes: null, archived_at: null,
  created_at: "", updated_at: "", last_session_date: null, session_count: 0,
};
const c = (o: Partial<ClientOverview>): ClientOverview => ({ ...base, ...o });
const today = "2026-10-27";

describe("buildAttention", () => {
  it("lists overdue and next-7-day reviews, most overdue first, ignoring inactive and archived clients", () => {
    const a = buildAttention(
      [
        c({ id: "late", next_review_date: "2026-10-20" }),
        c({ id: "soon", next_review_date: "2026-10-30" }),
        c({ id: "far", next_review_date: "2026-12-01" }),
        c({ id: "inactive", status: "inactive", next_review_date: "2026-10-01" }),
        c({ id: "archived", archived_at: "2026-10-01T00:00:00Z", next_review_date: "2026-10-01" }),
      ],
      today,
    );
    expect(a.reviews.map((r) => [r.client.id, r.kind])).toEqual([["late", "overdue"], ["soon", "soon"]]);
  });

  it("flags active PT clients who have gone quiet, but not assessments or recent trainees", () => {
    const a = buildAttention(
      [
        c({ id: "quiet", last_session_date: "2026-10-10" }),
        c({ id: "recent", last_session_date: "2026-10-20" }),
        c({ id: "assess", client_type: "fitness_assessment", last_session_date: "2026-09-01" }),
        c({ id: "never", start_date: "2026-10-01" }),
        c({ id: "new", start_date: null }),
      ],
      today,
    );
    expect(a.quiet.map((q) => [q.client.id, q.daysSince])).toEqual([["never", null], ["quiet", 17]]);
  });

  it("lists prospects", () => {
    expect(buildAttention([c({ id: "p", status: "prospect" }), c({ id: "x" })], today).prospects.map((p) => p.id)).toEqual(["p"]);
  });
});

describe("greeting", () => {
  it("follows the trainer's local hour", () => {
    expect(greeting(new Date("2026-10-27T13:00:00Z"), "America/New_York")).toBe("Good morning");
    expect(greeting(new Date("2026-10-27T19:00:00Z"), "America/New_York")).toBe("Good afternoon");
    expect(greeting(new Date("2026-10-28T01:00:00Z"), "America/New_York")).toBe("Good evening");
  });
});
