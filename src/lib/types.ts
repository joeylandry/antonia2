export type ClientType = "personal_training" | "fitness_assessment";
export type ClientStatus = "prospect" | "active" | "on_hold" | "inactive";
export type ExerciseMeasure = "weight" | "reps" | "duration";

export type Client = {
  id: string;
  full_name: string;
  client_type: ClientType;
  status: ClientStatus;
  session_length_minutes: number | null;
  sessions_per_week: number | null;
  start_date: string | null;
  assessment_date: string | null;
  next_review_date: string | null;
  primary_focus: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientOverview = Client & { last_session_date: string | null; session_count: number };

export type Exercise = { id: string; name: string; measure: ExerciseMeasure };

export type Goal = {
  id: string;
  client_id: string;
  title: string;
  exercise_id: string | null;
  target_weight: number | null;
  target_date: string | null;
  achieved_at: string | null;
  created_at: string;
};
