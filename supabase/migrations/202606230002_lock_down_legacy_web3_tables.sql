alter table if exists public.web3_talents enable row level security;
alter table if exists public.web3_mentors enable row level security;

revoke all on table public.web3_talents from anon, authenticated;
revoke all on table public.web3_mentors from anon, authenticated;

