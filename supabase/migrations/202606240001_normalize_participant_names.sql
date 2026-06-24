create or replace function public.normalize_certificate_participant_name(
  p_name text
)
returns text
language sql
immutable
as $$
  select initcap(lower(regexp_replace(btrim(p_name), '\s+', ' ', 'g')));
$$;

create or replace function public.set_normalized_certificate_participant_name()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.participant_name := public.normalize_certificate_participant_name(new.participant_name);
  return new;
end;
$$;

drop trigger if exists normalize_certificate_participant_name
  on public.certificate_recipients;

create trigger normalize_certificate_participant_name
before insert or update of participant_name
on public.certificate_recipients
for each row
execute function public.set_normalized_certificate_participant_name();

update public.certificate_recipients
set participant_name = public.normalize_certificate_participant_name(participant_name),
    updated_at = now()
where participant_name is distinct from public.normalize_certificate_participant_name(participant_name);

