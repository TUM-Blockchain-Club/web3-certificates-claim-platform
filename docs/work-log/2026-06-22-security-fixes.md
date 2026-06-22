# 2026-06-22 Security Fixes

## Work Completed

- Switched runtime data access from direct Postgres to the Supabase REST API.
- Kept direct Postgres access only for migration/import scripts.
- Found the working Supabase pooler region: `eu-west-1`.
- Applied both SQL migrations through the pooler.
- Imported 41 active participants from the CSV.
- Added a public verification view for the permanent verification site.
- Added a Supabase-backed fixed-window rate limiter for claim-link requests.
- Changed PDF generation back to local repository file reads for fonts/logos.
- Added output tracing includes for PDF assets.
- Added a pnpm override for `postcss@8.5.15`.
- Removed certificate metadata from runtime environment variables. New imports
  now use Supabase defaults for certificate name, cohort, and issue date.

## Rate Limiter

The claim-link endpoint now limits:

- 3 requests per normalized email per hour.
- 30 requests per client IP per hour.

Both keys are HMAC-hashed with `MAGIC_LINK_SECRET` before storage, so raw email
addresses and IP addresses are not stored in the rate-limit table.

## Verification

- `pnpm db:migrate`
- `pnpm import:participants`
- Supabase REST checks for the public verification view, recipient table, and rate-limit RPC.
- `pnpm audit --audit-level moderate`
