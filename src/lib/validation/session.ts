import { z } from "zod";

const num = (min: number, max: number, int = false) => {
  let s = z.number().min(min).max(max);
  if (int) s = s.int();
  return s.nullable();
};

export const setSchema = z.object({
  reps: num(0, 1000, true),
  weight: num(0, 2000).refine((w) => w == null || Math.round(w * 10) === w * 10, "At most one decimal place"),
  duration_seconds: num(0, 86400, true),
  load_label: z.string().trim().max(60).nullable().transform((v) => v || null),
});

export const entrySchema = z.object({
  name: z.string().trim().min(1, "Choose an exercise").max(120),
  measure: z.enum(["weight", "reps", "duration"]),
  per_side: z.boolean(),
  notes: z.string().trim().max(5000).nullable().transform((v) => v || null),
  sets: z.array(setSchema).max(50),
});

export const sessionSchema = z.object({
  client_id: z.uuid(),
  session_id: z.uuid().nullable(),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  focus: z.string().trim().max(200, "Keep the focus under 200 characters").nullable().transform((v) => v || null),
  notes: z.string().trim().max(20000).nullable().transform((v) => v || null),
  entries: z.array(entrySchema).min(1, "Add at least one exercise").max(60),
});

export type SessionPayload = z.infer<typeof sessionSchema>;
export type EntryPayload = z.infer<typeof entrySchema>;

/** A set the trainer left completely blank carries no information and is dropped. */
export function isBlankSet(s: { reps: number | null; weight: number | null; duration_seconds: number | null; load_label: string | null }) {
  return s.reps == null && s.weight == null && s.duration_seconds == null && !s.load_label;
}
