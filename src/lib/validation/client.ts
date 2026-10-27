import { z } from "zod";

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
  .refine((v) => {
    const t = Date.parse(`${v}T00:00:00Z`);
    return !Number.isNaN(t) && new Date(t).toISOString().startsWith(v);
  }, "Enter a valid date");

const optionalDate = z.preprocess(emptyToUndefined, isoDate.optional());

const optionalInt = (min: number, max: number, label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number({ error: `${label} must be a number` }).int(`${label} must be a whole number`).min(min, `${label} must be at least ${min}`).max(max, `${label} must be at most ${max}`).optional(),
  );

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, `Keep this under ${max} characters`).optional());

export const clientSchema = z.object({
  full_name: z.string().trim().min(1, "Enter the client's name").max(120, "Keep the name under 120 characters"),
  client_type: z.enum(["personal_training", "fitness_assessment"]),
  status: z.enum(["prospect", "active", "on_hold", "inactive"]),
  session_length_minutes: optionalInt(5, 240, "Session length"),
  sessions_per_week: optionalInt(0, 14, "Sessions per week"),
  start_date: optionalDate,
  assessment_date: optionalDate,
  next_review_date: optionalDate,
  primary_focus: optionalText(1000),
  notes: optionalText(20000),
});

export type ClientInput = z.infer<typeof clientSchema>;

export function formToObject(formData: FormData): Record<string, FormDataEntryValue> {
  const out: Record<string, FormDataEntryValue> = {};
  for (const [k, v] of formData.entries()) if (!k.startsWith("$ACTION")) out[k] = v;
  return out;
}

export function zodFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
