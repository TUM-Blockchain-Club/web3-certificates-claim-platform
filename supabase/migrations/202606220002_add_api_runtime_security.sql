create or replace view public.certificate_public_verifications as
select
  certificate_id,
  cohort,
  certificate_name,
  participant_name,
  certificate_issued_on
from public.certificate_recipients
where verification_active = true;

grant select on public.certificate_public_verifications to anon;
grant select on public.certificate_public_verifications to authenticated;
grant select on public.certificate_public_verifications to service_role;

create table if not exists public.certificate_rate_limits (
  key_hash text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (key_hash, window_start),
  constraint certificate_rate_limits_count_positive check (count > 0)
);

create index if not exists certificate_rate_limits_updated_at_idx
  on public.certificate_rate_limits (updated_at);

alter table public.certificate_rate_limits enable row level security;

create or replace function public.consume_certificate_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_key_hash is null or length(p_key_hash) < 32 then
    raise exception 'invalid rate-limit key';
  end if;

  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate-limit configuration';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.certificate_rate_limits (
    key_hash,
    window_start,
    count,
    updated_at
  )
  values (
    p_key_hash,
    v_window_start,
    1,
    now()
  )
  on conflict (key_hash, window_start)
  do update set
    count = public.certificate_rate_limits.count + 1,
    updated_at = now()
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

grant execute on function public.consume_certificate_rate_limit(text, integer, integer)
  to anon, authenticated, service_role;

