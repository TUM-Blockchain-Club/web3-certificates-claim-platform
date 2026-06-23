# 2026-06-23 Verification View Access

## Finding

`certificate_public_verifications` is a view, not a table, so it does not have
table RLS. It previously allowed `anon` and `authenticated` reads, which meant
the publishable key could list certificate IDs and participant names.

## Change

Added and applied migration
`202606230004_restrict_verification_view_access.sql`.

The view now grants `select` only to `service_role`. The permanent verification
site queries it server-side with `SUPABASE_SECRET_KEY`.

## Verification

- Publishable-key access to `certificate_public_verifications` returns
  `permission denied`.
- Server secret access can still fetch verification rows.

