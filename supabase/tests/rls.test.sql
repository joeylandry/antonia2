-- Run by scripts/test-db.sh against a scratch Postgres. Any failed assertion aborts with an error.
\set ON_ERROR_STOP on

insert into auth.users (id, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '{"display_name":"Antonia"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '{"display_name":"Other Trainer"}');

create function pg_temp.assert(cond boolean, msg text) returns void language plpgsql as
$$ begin if not coalesce(cond, false) then raise exception 'FAILED: %', msg; end if; end $$;

select pg_temp.assert((select count(*) from public.trainer_profiles) = 2, 'profile trigger creates a row per user');

-- Trainer A creates data ---------------------------------------------------------------------
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';

insert into public.clients (id, full_name, primary_focus) values
  ('c1000000-0000-0000-0000-000000000001', 'Client One', 'strength');
insert into public.exercises (id, name) values
  ('e1000000-0000-0000-0000-000000000001', 'Goblet Squat');

select public.save_session(null, 'c1000000-0000-0000-0000-000000000001', '2026-10-06', 'Lower Body', null,
  '[{"exercise_id":"e1000000-0000-0000-0000-000000000001","notes":"felt easy","sets":[
     {"reps":12,"weight":24},{"reps":12,"weight":32}]}]'::jsonb);
select public.save_session(null, 'c1000000-0000-0000-0000-000000000001', '2026-10-09', 'Lower Body', null,
  '[{"exercise_id":"e1000000-0000-0000-0000-000000000001","sets":[{"reps":10,"weight":35}]}]'::jsonb);

select pg_temp.assert((select count(*) from public.sessions) = 2, 'A sees own sessions');
select pg_temp.assert((select count(*) from public.entry_sets) = 3, 'sets saved');
select pg_temp.assert((select top_weight from public.exercise_progress order by session_date limit 1) = 32, 'progress view top weight');
select pg_temp.assert((select volume from public.exercise_progress order by session_date limit 1) = 12*24 + 12*32, 'progress view volume');

-- Replacing a session replaces its entries atomically
select public.save_session((select id from public.sessions where session_date = '2026-10-09'),
  'c1000000-0000-0000-0000-000000000001', '2026-10-09', 'Lower Body', 'edited',
  '[{"exercise_id":"e1000000-0000-0000-0000-000000000001","sets":[{"reps":8,"weight":40}]}]'::jsonb);
select pg_temp.assert((select count(*) from public.entry_sets) = 3, 'edit replaced sets, not appended');
select pg_temp.assert((select max(weight) from public.entry_sets) = 40, 'edited weight stored');
select pg_temp.assert((select last_session_date from public.client_overview) = '2026-10-09' and (select session_count from public.client_overview) = 2, 'client overview summarises sessions');

-- Trainer B cannot see or touch A's data -------------------------------------------------------
set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
select pg_temp.assert((select count(*) from public.clients) = 0, 'B sees no clients');
select pg_temp.assert((select count(*) from public.sessions) = 0, 'B sees no sessions');
select pg_temp.assert((select count(*) from public.entry_sets) = 0, 'B sees no sets');
select pg_temp.assert((select count(*) from public.exercise_progress) = 0, 'B sees no progress rows');
select pg_temp.assert((select count(*) from public.client_overview) = 0, 'B sees no client overview rows');
select pg_temp.assert((select count(*) from public.trainer_profiles) = 1, 'B sees only own profile');

update public.clients set full_name = 'hijacked';
select pg_temp.assert((select count(*) from public.clients) = 0, 'B update affects nothing');

do $$ begin
  begin
    insert into public.clients (trainer_id, full_name) values ('aaaaaaaa-0000-0000-0000-000000000001', 'x');
    raise exception 'FAILED: B inserted a row as A';
  exception when insufficient_privilege or check_violation then null; end;
  begin
    insert into public.sessions (client_id, session_date) values ('c1000000-0000-0000-0000-000000000001', '2026-11-01');
    raise exception 'FAILED: B attached a session to A''s client';
  exception when foreign_key_violation then null; end;
  begin
    perform public.save_session(null, 'c1000000-0000-0000-0000-000000000001', '2026-11-01', null, null, '[]');
    raise exception 'FAILED: B saved a session for A''s client';
  exception when foreign_key_violation then null; end;
end $$;

delete from public.clients;
reset role;
select pg_temp.assert((select count(*) from public.clients) = 1, 'B delete affects nothing');

-- Anonymous users get nothing --------------------------------------------------------------
set role anon;
do $$ begin
  begin
    perform count(*) from public.clients;
    raise exception 'FAILED: anon could read clients';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Constraints ---------------------------------------------------------------------------------
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
do $$ begin
  begin insert into public.clients (full_name) values ('   '); raise exception 'FAILED: blank name accepted';
  exception when check_violation then null; end;
  begin insert into public.exercises (name) values ('goblet squat'); raise exception 'FAILED: duplicate exercise accepted';
  exception when unique_violation then null; end;
  begin
    insert into public.goals (client_id, title, target_weight) values ('c1000000-0000-0000-0000-000000000001', 'Squat 180', 180);
    raise exception 'FAILED: weight target without exercise accepted';
  exception when check_violation then null; end;
end $$;

-- Deleting a client removes its history; exercises referenced by history cannot be deleted
do $$ begin
  begin delete from public.exercises; raise exception 'FAILED: used exercise deleted';
  exception when foreign_key_violation then null; end;
end $$;
delete from public.clients where id = 'c1000000-0000-0000-0000-000000000001';
select pg_temp.assert((select count(*) from public.sessions) = 0 and (select count(*) from public.entry_sets) = 0, 'client delete cascades');
reset role;

\echo 'All database tests passed'
