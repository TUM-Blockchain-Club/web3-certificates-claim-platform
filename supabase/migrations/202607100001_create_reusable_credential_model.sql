drop view if exists public.certificate_public_verifications;

drop trigger if exists normalize_certificate_participant_name
  on public.certificate_recipients;

alter table public.certificate_recipients
  rename to certificate_recipients_legacy;

alter table public.certificate_nft_preferences
  drop constraint certificate_nft_preferences_recipient_id_fkey;

alter table public.certificate_audit_events
  drop constraint certificate_audit_events_recipient_id_fkey;

create table public.certificate_programs (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now(),
  constraint certificate_programs_id_format
    check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint certificate_programs_name_nonempty
    check (btrim(name) <> '')
);

create table public.certificate_program_runs (
  id text primary key,
  program_id text not null references public.certificate_programs(id),
  label text not null,
  created_at timestamptz not null default now(),
  constraint certificate_program_runs_id_format
    check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint certificate_program_runs_label_nonempty
    check (btrim(label) <> '')
);

create index certificate_program_runs_program_id_idx
  on public.certificate_program_runs (program_id);

insert into public.certificate_programs (id, name)
values ('blockchain-fundamentals', 'Blockchain Fundamentals');

insert into public.certificate_program_runs (id, program_id, label)
values (
  'blockchain-fundamentals-1',
  'blockchain-fundamentals',
  'Blockchain Fundamentals 1'
);

create table public.certificate_recipients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  preferred_first_name text not null,
  family_name text not null,
  public_display_name text not null,
  email text not null,
  email_normalized text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certificate_recipients_names_nonempty
    check (
      btrim(full_name) <> ''
      and btrim(preferred_first_name) <> ''
      and btrim(family_name) <> ''
      and btrim(public_display_name) <> ''
    ),
  constraint certificate_recipients_email_normalized_lowercase
    check (email_normalized = lower(email_normalized))
);

insert into public.certificate_recipients (
  id,
  full_name,
  preferred_first_name,
  family_name,
  public_display_name,
  email,
  email_normalized,
  created_at,
  updated_at
)
select
  id,
  participant_name,
  split_part(participant_name, ' ', 1),
  regexp_replace(participant_name, '^.*[[:space:]]+', ''),
  split_part(participant_name, ' ', 1)
    || ' '
    || left(regexp_replace(participant_name, '^.*[[:space:]]+', ''), 1)
    || '.',
  email,
  email_normalized,
  created_at,
  updated_at
from public.certificate_recipients_legacy;

create table public.certificate_credentials (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.certificate_recipients(id),
  program_run_id text not null references public.certificate_program_runs(id),
  certificate_id text not null unique,
  credential_type text not null,
  certificate_name text not null,
  issued_on date not null,
  source_status text not null default 'Active',
  verification_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certificate_credentials_certificate_id_format
    check (certificate_id ~ '^[A-Za-z0-9_-]{16,80}$'),
  constraint certificate_credentials_type
    check (credential_type in ('participant', 'mentor')),
  constraint certificate_credentials_source_status
    check (source_status in ('Active', 'Inactive')),
  constraint certificate_credentials_recipient_run_type_unique
    unique (recipient_id, program_run_id, credential_type)
);

insert into public.certificate_credentials (
  id,
  recipient_id,
  program_run_id,
  certificate_id,
  credential_type,
  certificate_name,
  issued_on,
  source_status,
  verification_active,
  created_at,
  updated_at
)
select
  id,
  id,
  'blockchain-fundamentals-1',
  certificate_id,
  certificate_type,
  certificate_name,
  certificate_issued_on,
  case when source_status = 'Active (YES)' then 'Active' else 'Inactive' end,
  verification_active,
  created_at,
  updated_at
from public.certificate_recipients_legacy;

create index certificate_credentials_recipient_id_idx
  on public.certificate_credentials (recipient_id);

create index certificate_credentials_program_run_type_idx
  on public.certificate_credentials (program_run_id, credential_type);

alter table public.certificate_nft_preferences
  rename column recipient_id to credential_id;

alter table public.certificate_nft_preferences
  add constraint certificate_nft_preferences_credential_id_fkey
  foreign key (credential_id)
  references public.certificate_credentials(id)
  on delete cascade;

alter table public.certificate_audit_events
  rename column recipient_id to credential_id;

alter table public.certificate_audit_events
  add constraint certificate_audit_events_credential_id_fkey
  foreign key (credential_id)
  references public.certificate_credentials(id)
  on delete set null;

drop table public.certificate_recipients_legacy;

drop function if exists public.set_normalized_certificate_participant_name();
drop function if exists public.normalize_certificate_participant_name(text);

create table public.certificate_issuances (
  id bigint generated always as identity primary key,
  credential_id uuid not null references public.certificate_credentials(id),
  chain_id bigint not null,
  contract_address text not null,
  token_id numeric(78, 0) not null,
  transaction_hash text not null unique,
  recipient_address text not null,
  metadata_uri text not null,
  manifest_sha256 text not null,
  status text not null default 'active',
  issued_at timestamptz not null,
  revoked_at timestamptz,
  constraint certificate_issuances_chain_id_positive
    check (chain_id > 0),
  constraint certificate_issuances_contract_address_format
    check (contract_address ~ '^0x[0-9A-Fa-f]{40}$'),
  constraint certificate_issuances_transaction_hash_format
    check (transaction_hash ~ '^0x[0-9A-Fa-f]{64}$'),
  constraint certificate_issuances_recipient_address_format
    check (recipient_address ~ '^0x[0-9A-Fa-f]{40}$'),
  constraint certificate_issuances_metadata_uri_format
    check (metadata_uri ~ '^ipfs://'),
  constraint certificate_issuances_manifest_sha256_format
    check (manifest_sha256 ~ '^[0-9a-f]{64}$'),
  constraint certificate_issuances_status
    check (
      (status = 'active' and revoked_at is null)
      or (status = 'revoked' and revoked_at is not null)
    ),
  constraint certificate_issuances_token_unique
    unique (chain_id, contract_address, token_id)
);

create index certificate_issuances_credential_id_idx
  on public.certificate_issuances (credential_id);

create unique index certificate_issuances_one_active_per_credential_idx
  on public.certificate_issuances (credential_id)
  where status = 'active';

create or replace view public.certificate_claim_records as
select
  r.id as recipient_id,
  c.id as credential_row_id,
  c.certificate_id,
  c.credential_type as certificate_type,
  pr.label as cohort,
  c.certificate_name,
  r.full_name as participant_name,
  r.public_display_name,
  r.email,
  c.issued_on as certificate_issued_on
from public.certificate_credentials c
join public.certificate_recipients r on r.id = c.recipient_id
join public.certificate_program_runs pr on pr.id = c.program_run_id
where c.verification_active = true
  and c.source_status = 'Active';

create or replace view public.certificate_public_verifications as
select
  c.certificate_id,
  pr.label as cohort,
  c.certificate_name,
  r.public_display_name as participant_name,
  c.issued_on as certificate_issued_on,
  c.credential_type as certificate_type
from public.certificate_credentials c
join public.certificate_recipients r on r.id = c.recipient_id
join public.certificate_program_runs pr on pr.id = c.program_run_id
where c.verification_active = true
  and c.source_status = 'Active';

alter table public.certificate_programs enable row level security;
alter table public.certificate_program_runs enable row level security;
alter table public.certificate_recipients enable row level security;
alter table public.certificate_credentials enable row level security;
alter table public.certificate_issuances enable row level security;

revoke all on table public.certificate_programs from anon, authenticated;
revoke all on table public.certificate_program_runs from anon, authenticated;
revoke all on table public.certificate_recipients from anon, authenticated;
revoke all on table public.certificate_credentials from anon, authenticated;
revoke all on table public.certificate_issuances from anon, authenticated;
revoke all on table public.certificate_claim_records from anon, authenticated;
revoke all on table public.certificate_public_verifications from anon, authenticated;

grant select, insert, update on table public.certificate_programs to service_role;
grant select, insert, update on table public.certificate_program_runs to service_role;
grant select, insert, update on table public.certificate_recipients to service_role;
grant select, insert, update on table public.certificate_credentials to service_role;
grant select, insert, update on table public.certificate_issuances to service_role;
grant select on table public.certificate_claim_records to service_role;
grant select on table public.certificate_public_verifications to service_role;
grant usage, select on sequence public.certificate_issuances_id_seq to service_role;
