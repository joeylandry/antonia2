-- Antonia Training: initial schema.
-- Every row belongs to a trainer (trainer_id = auth.uid()). Row-level security limits each
-- trainer to their own rows, and composite foreign keys stop a row from referencing another
-- trainer's data. Adding more trainer accounts later needs no schema change.

create type public.client_type as enum ('personal_training', 'fitness_assessment');
create type public.client_status as enum ('prospect', 'active', 'on_hold', 'inactive');
create type public.exercise_measure as enum ('weight', 'reps', 'duration');

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Trainers ---------------------------------------------------------------------------------
create table public.trainer_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trainer_profiles_updated before update on public.trainer_profiles
  for each row execute function public.set_updated_at();

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.trainer_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Clients ----------------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid() references public.trainer_profiles (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  client_type public.client_type not null default 'personal_training',
  status public.client_status not null default 'active',
  session_length_minutes smallint check (session_length_minutes between 5 and 240),
  sessions_per_week smallint check (sessions_per_week between 0 and 14),
  start_date date,
  assessment_date date,
  next_review_date date,
  primary_focus text check (char_length(primary_focus) <= 1000),
  notes text check (char_length(notes) <= 20000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, trainer_id)
);
create index clients_trainer_active_idx on public.clients (trainer_id, archived_at, next_review_date);
create trigger clients_updated before update on public.clients
  for each row execute function public.set_updated_at();

-- Exercise library (one canonical row per exercise name, so history groups correctly) ------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid() references public.trainer_profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  measure public.exercise_measure not null default 'weight',
  created_at timestamptz not null default now(),
  unique (id, trainer_id)
);
create unique index exercises_trainer_name_idx on public.exercises (trainer_id, lower(btrim(name)));

-- Goals ------------------------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  client_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  exercise_id uuid,
  target_weight numeric(6, 1) check (target_weight > 0 and target_weight <= 2000),
  target_date date,
  achieved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (client_id, trainer_id) references public.clients (id, trainer_id) on delete cascade,
  foreign key (exercise_id, trainer_id) references public.exercises (id, trainer_id) on delete set null (exercise_id),
  check (target_weight is null or exercise_id is not null)
);
create index goals_client_idx on public.goals (client_id);
create trigger goals_updated before update on public.goals
  for each row execute function public.set_updated_at();

-- Sessions: one dated workout, with one entry per exercise and one row per set -------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  client_id uuid not null,
  session_date date not null,
  focus text check (char_length(focus) <= 200),
  notes text check (char_length(notes) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (client_id, trainer_id) references public.clients (id, trainer_id) on delete cascade,
  unique (id, trainer_id)
);
create index sessions_client_date_idx on public.sessions (client_id, session_date desc);
create trigger sessions_updated before update on public.sessions
  for each row execute function public.set_updated_at();

create table public.session_entries (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  session_id uuid not null,
  exercise_id uuid not null,
  position smallint not null default 0,
  per_side boolean not null default false,
  notes text check (char_length(notes) <= 5000),
  foreign key (session_id, trainer_id) references public.sessions (id, trainer_id) on delete cascade,
  foreign key (exercise_id, trainer_id) references public.exercises (id, trainer_id) on delete restrict,
  unique (id, trainer_id)
);
create index session_entries_session_idx on public.session_entries (session_id, position);
create index session_entries_exercise_idx on public.session_entries (exercise_id);

create table public.entry_sets (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  entry_id uuid not null,
  set_number smallint not null check (set_number between 1 and 50),
  reps smallint check (reps between 0 and 1000),
  weight numeric(6, 1) check (weight >= 0 and weight <= 2000),   -- pounds
  duration_seconds integer check (duration_seconds between 0 and 86400),
  load_label text check (char_length(load_label) <= 60),          -- e.g. "orange band"
  foreign key (entry_id, trainer_id) references public.session_entries (id, trainer_id) on delete cascade,
  unique (entry_id, set_number)
);

-- Row-level security -----------------------------------------------------------------------
alter table public.trainer_profiles enable row level security;
create policy trainer_profiles_own on public.trainer_profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['clients', 'exercises', 'goals', 'sessions', 'session_entries', 'entry_sets']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (trainer_id = (select auth.uid())) with check (trainer_id = (select auth.uid()))',
      t || '_own', t);
  end loop;
end $$;

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Progress per exercise and session date (runs with the caller's permissions) ----------------
create view public.exercise_progress with (security_invoker = true) as
select
  s.client_id,
  e.exercise_id,
  s.id as session_id,
  s.session_date,
  max(st.weight) as top_weight,
  max(st.reps) as top_reps,
  max(st.duration_seconds) as top_duration_seconds,
  coalesce(sum(st.weight * st.reps), 0) as volume,
  count(st.id) as set_count
from public.session_entries e
join public.sessions s on s.id = e.session_id
left join public.entry_sets st on st.entry_id = e.id
group by s.client_id, e.exercise_id, s.id, s.session_date;
grant select on public.exercise_progress to authenticated;

-- Atomic save of a whole session (create or replace its entries) ---------------------------
-- p_entries: [{ "exercise_id": uuid, "per_side": bool, "notes": text,
--               "sets": [{ "reps": int, "weight": num, "duration_seconds": int, "load_label": text }] }]
create function public.save_session(
  p_session_id uuid, p_client_id uuid, p_session_date date,
  p_focus text, p_notes text, p_entries jsonb
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
  v_entry jsonb;
  v_set jsonb;
  v_entry_id uuid;
  v_pos smallint := 0;
  v_n smallint;
begin
  if jsonb_typeof(coalesce(p_entries, '[]'::jsonb)) <> 'array' then
    raise exception 'p_entries must be an array';
  end if;

  if p_session_id is null then
    insert into public.sessions (client_id, session_date, focus, notes)
    values (p_client_id, p_session_date, nullif(btrim(p_focus), ''), nullif(btrim(p_notes), ''))
    returning id into v_id;
  else
    update public.sessions
       set session_date = p_session_date, focus = nullif(btrim(p_focus), ''), notes = nullif(btrim(p_notes), '')
     where id = p_session_id and client_id = p_client_id
    returning id into v_id;
    if v_id is null then raise exception 'session not found'; end if;
    delete from public.session_entries where session_id = v_id;
  end if;

  for v_entry in select * from jsonb_array_elements(coalesce(p_entries, '[]'::jsonb)) loop
    insert into public.session_entries (session_id, exercise_id, position, per_side, notes)
    values (v_id, (v_entry ->> 'exercise_id')::uuid, v_pos,
            coalesce((v_entry ->> 'per_side')::boolean, false), nullif(btrim(v_entry ->> 'notes'), ''))
    returning id into v_entry_id;
    v_pos := v_pos + 1;
    v_n := 0;
    for v_set in select * from jsonb_array_elements(coalesce(v_entry -> 'sets', '[]'::jsonb)) loop
      v_n := v_n + 1;
      insert into public.entry_sets (entry_id, set_number, reps, weight, duration_seconds, load_label)
      values (v_entry_id, v_n, (v_set ->> 'reps')::smallint, (v_set ->> 'weight')::numeric,
              (v_set ->> 'duration_seconds')::integer, nullif(btrim(v_set ->> 'load_label'), ''));
    end loop;
  end loop;
  return v_id;
end $$;
revoke all on function public.save_session from public, anon;
grant execute on function public.save_session to authenticated;
