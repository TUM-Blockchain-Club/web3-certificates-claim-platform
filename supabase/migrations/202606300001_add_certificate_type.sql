alter table public.certificate_recipients
  add column if not exists certificate_type text not null default 'participant';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'certificate_recipients_certificate_type'
      and conrelid = 'public.certificate_recipients'::regclass
  ) then
    alter table public.certificate_recipients
      add constraint certificate_recipients_certificate_type
      check (certificate_type in ('participant', 'mentor'));
  end if;
end;
$$;

create or replace view public.certificate_public_verifications as
select
  certificate_id,
  cohort,
  certificate_name,
  participant_name,
  certificate_issued_on,
  certificate_type
from public.certificate_recipients
where verification_active = true;

revoke all on table public.certificate_public_verifications from anon, authenticated;
revoke all on table public.certificate_public_verifications from service_role;

grant select on table public.certificate_public_verifications to service_role;
