# 2026-06-23 Legacy Table RLS Review

## Findings

The project-owned certificate tables in `public` already had RLS enabled:

- `certificate_recipients`
- `certificate_nft_preferences`
- `certificate_rate_limits`
- `certificate_audit_events`

Two legacy prototype tables in `public` did not have RLS:

- `web3_talents`
- `web3_mentors`

These tables are not created or used by the maintained certificate claim and
verification repositories. They are referenced by the older
`TUM-Blockchain-Club/web3certificates` prototype, which queried and inserted
`web3_talents` from a browser Supabase client.

## Change

Added and applied migration
`202606230002_lock_down_legacy_web3_tables.sql`.

The migration:

- enables RLS on `web3_talents` and `web3_mentors`;
- revokes direct `anon` and `authenticated` table privileges.

No legacy rows were deleted in this first step.

After confirming the maintained certificate flow does not need the legacy
prototype tables, added and applied migration
`202606230003_drop_legacy_web3_tables.sql`.

The deletion migration removes:

- `web3_talents`
- `web3_mentors`

## Verification

After applying the migration:

- only maintained certificate tables remain in `public`;
- every table in `public` has RLS enabled;
- `web3_talents` and `web3_mentors` no longer exist;
- `certificate_public_verifications` remains publicly readable as intended.

The remaining non-RLS tables are Supabase-managed tables in `auth`, `realtime`,
and `vault`, not project-owned application tables.
