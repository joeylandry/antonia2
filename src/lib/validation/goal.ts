import { z } from "zod";
import { isoDate } from "@/lib/validation/client";

const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const goalSchema = z
  .object({
    title: z.string().trim().min(1, "Describe the goal").max(300, "Keep the goal under 300 characters"),
    exercise_name: z.preprocess(blank, z.string().trim().max(120).optional()),
    target_weight: z.preprocess(
      blank,
      z.coerce.number({ error: "Target weight must be a number" }).positive("Target weight must be above 0").max(2000, "Target weight must be 2000 or less").optional(),
    ),
    target_date: z.preprocess(blank, isoDate.optional()),
  })
  .refine((g) => g.target_weight == null || !!g.exercise_name, { path: ["exercise_name"], message: "Choose the exercise this weight is for" });
