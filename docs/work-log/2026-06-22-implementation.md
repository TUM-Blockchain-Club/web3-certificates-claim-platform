# 2026-06-22 Implementation

## Scope

Created the temporary Web3 Talents certificate claim platform for `claim-platform.web3-talents.com`.

## Decisions

- Certificates are generated on demand and not stored.
- PDF credibility is anchored to a permanent verification URL on `certificates.web3-talents.com`.
- Magic links are stateless HMAC-signed tokens with one-hour expiry.
- Participants can request multiple links; tokens are not consumed during the validity window.
- The import script only inserts CSV rows with status `Active (YES)`.
- NFT minting is out of scope. This app stores `evm_wallet`, `tbc_wallet`, or `none` preferences.
- Database migration uses `scripts/run-migration.mjs` so `.env` is loaded through `dotenv`, not shell sourcing.
- Participant import supports `--dry-run` to preview the active-row filter without connecting to Supabase.

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- CSV dry run reported 41 active participants, 30 no-response rows, and 6 left-program rows.

## Blocked External Step

Applying the migration/import to Supabase is blocked because the provided database password was rejected on the direct host, and later direct-host attempts were refused over the IPv6-only database hostname from this environment. Common Supabase pooler endpoints did not recognize the project tenant. A valid Supabase database connection string or working pooler connection string is required before `pnpm db:migrate` and the real import can complete.

## Asset Sources

- `public/tbc-wordmark.png` from `/home/codex/projects/website/public/tbc-wordmark.png`
- `public/web3-talents-logo.png` from `/home/codex/projects/web3-talents-website/public/logo/black text/large.png`
