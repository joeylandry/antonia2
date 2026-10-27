-- Client list with activity summary, computed with the caller's permissions.
create view public.client_overview with (security_invoker = true) as
select
  c.*,
  (select max(s.session_date) from public.sessions s where s.client_id = c.id) as last_session_date,
  (select count(*) from public.sessions s where s.client_id = c.id) as session_count
from public.clients c;
grant select on public.client_overview to authenticated;
