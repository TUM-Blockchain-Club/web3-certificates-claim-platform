alter table if exists public.web3_talents enable row level security;
alter table if exists public.web3_mentors enable row level security;

do $$
begin
  if to_regclass('public.web3_talents') is not null then
    revoke all on table public.web3_talents from anon, authenticated;
  end if;

  if to_regclass('public.web3_mentors') is not null then
    revoke all on table public.web3_mentors from anon, authenticated;
  end if;
end;
$$;
