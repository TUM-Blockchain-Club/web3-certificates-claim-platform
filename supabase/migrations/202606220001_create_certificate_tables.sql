create extension if not exists pgcrypto;

create table if not exists public.certificate_recipients (
  id uuid primary key default gen_random_uuid(),
  certificate_id text not null unique,
  cohort text not null default 'Cohort 1',
  certificate_name text not null default 'Web3 Talents Certificate',
  participant_name text not null,
  email text not null,
  email_normalized text not null unique,
  source_status text not null default 'Active (YES)',
  certificate_issued_on date not null,
  verification_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certificate_recipients_certificate_id_format
    check (certificate_id ~ '^[A-Za-z0-9_-]{16,80}$'),
  constraint certificate_recipients_email_normalized_lowercase
    check (email_normalized = lower(email_normalized)),
  constraint certificate_recipients_source_status_active
    check (source_status = 'Active (YES)')
);

create table if not exists public.certificate_nft_preferences (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null unique references public.certificate_recipients(id) on delete cascade,
  destination_type text not null,
  evm_address text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certificate_nft_preferences_destination_type
    check (destination_type in ('evm_wallet', 'tbc_wallet', 'none')),
  constraint certificate_nft_preferences_evm_shape
    check (
      (destination_type = 'evm_wallet' and evm_address ~ '^0x[0-9A-Fa-f]{40}$')
      or
      (destination_type in ('tbc_wallet', 'none') and evm_address is null)
    )
);

create table if not exists public.certificate_audit_events (
  id bigint generated always as identity primary key,
  recipient_id uuid references public.certificate_recipients(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists certificate_recipients_certificate_id_idx
  on public.certificate_recipients (certificate_id);

create index if not exists certificate_recipients_email_normalized_idx
  on public.certificate_recipients (email_normalized);

create index if not exists certificate_nft_preferences_recipient_id_idx
  on public.certificate_nft_preferences (recipient_id);

create index if not exists certificate_audit_events_recipient_id_idx
  on public.certificate_audit_events (recipient_id);

alter table public.certificate_recipients enable row level security;
alter table public.certificate_nft_preferences enable row level security;
alter table public.certificate_audit_events enable row level security;

