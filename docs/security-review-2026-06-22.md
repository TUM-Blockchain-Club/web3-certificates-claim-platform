# Security Review 2026-06-22

## Scope

Repository: `web3-certificates-claim-platform`

Reviewed:

- Magic-link generation and verification.
- Mailgun delivery.
- Server Actions.
- PDF route and renderer.
- Supabase migration and scripts.
- Wallet preference storage.
- Dependency audit.
- Supabase connectivity from the local environment.

## Findings

### Resolved After Review: Supabase Runtime API Is Connected

The claim platform now uses the Supabase REST API with the server-only secret key at runtime. The required tables, public verification view, and rate-limit RPC were created through the Supabase pooler.

The direct database host remains IPv6-only from this environment, but the operational pooler URL works for SQL migrations/imports.

The active participant import completed with 41 rows.

### Resolved After Review: Runtime Database URL Removed

The runtime app was changed to use the Supabase REST API with the server-only secret key. The direct Postgres URL is now only for migration/import scripts.

The Supabase secret key still bypasses RLS by design, so keep it server-only. Creating custom Postgres roles still requires SQL access or the Supabase SQL editor; it cannot be done with publishable/secret API keys alone.

### Resolved After Review: Email Claim Endpoint Has Rate Limiting

`requestClaimLink` now checks a Supabase-backed fixed-window limiter before recipient lookup or Mailgun sending. It limits both hashed email and hashed IP keys.

The supporting rate-limit table and RPC are defined in the migrations and still need to be applied through SQL access.

### P2: Magic Links Are In Query Strings And Are Reused For PDF Downloads

Magic links are intentionally stateless and valid for one hour. The same token is also appended to the PDF download URL. Query-string tokens are commonly recorded in browser history, reverse-proxy logs, platform logs, and analytics if added later.

Recommendation: after the user opens `/claim?token=...`, exchange the token for an HttpOnly, SameSite cookie scoped to the claim site, then remove the token from subsequent links and PDF downloads.

### Resolved After Review: PDF Assets Load From Local Files

The PDF renderer now reads fonts and logos from local repository files under `public/`. The PDF route includes these files in output tracing.

### Resolved After Review: PostCSS Advisory Fixed

The repo now pins `postcss` to `8.5.15` through a pnpm override. `pnpm audit --audit-level moderate` reports no known vulnerabilities.

### P3: Coverage Gaps Around Security-Critical Logic

There are no automated tests for token tamper rejection, token expiry, CSV active-row filtering, EVM address validation, or NFT preference constraints.

Recommendation: add focused unit tests for these rules before launch.

## Positive Notes

- No committed secrets were found in the repository or `.env.example` history.
- Magic-link payloads do not contain email addresses or names.
- Magic-link signatures use HMAC-SHA256 and timing-safe comparison.
- Recipient existence is not revealed by the email request response.
- SQL queries use parameterized `postgres` tagged templates.
- EVM wallet format is validated in the UI, server action, and database constraint.
- PDF responses use `Cache-Control: private, no-store`.
- Generated PDFs are not stored.
- CSV dry run confirmed 41 active participants, excluding 30 no-response and 6 left-program rows.
- Live import inserted/updated 41 active participants.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass.
- `pnpm audit --audit-level moderate` passes.
