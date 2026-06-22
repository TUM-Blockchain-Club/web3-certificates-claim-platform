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

### P1: Supabase Postgres Is Not Connected From This Environment

The claim platform depends on `DATABASE_URL`, but the direct Supabase database host is not reachable from the local environment. A connection test failed with `ECONNREFUSED` against the IPv6-only database host. Earlier manual `psql` attempts also failed with the provided password.

Impact: migrations cannot be applied, participants cannot be imported, magic-link requests cannot find recipients, PDF downloads cannot load recipients, and NFT preferences cannot be saved.

Recommendation: provide a working Supabase pooler connection string or corrected database password. Prefer the pooler for deployed serverless runtimes.

### P1: Runtime Database URL Appears To Be A Broad Postgres Credential

The app uses `DATABASE_URL` directly from server runtime. The provided URL is for the `postgres` user. RLS is enabled in the migration, but this does not materially protect the app if it connects as a highly privileged database role.

Recommendation: create least-privileged roles:

- claim app role: select recipients by normalized email/id/certificate ID, insert audit events, upsert NFT preferences;
- verification app role: read-only access to a public verification view;
- migration/import role: separate operational credential, not used by runtime apps.

### P1: Email Claim Endpoint Has No Abuse Throttling

`requestClaimLink` uses a neutral response, which avoids email enumeration, but it has no rate limiting by IP, email hash, or global volume. An attacker who knows or guesses an eligible email can repeatedly trigger Mailgun messages.

Recommendation: add a real rate limiter before sending Mailgun messages. A small Supabase-backed request table, Redis/Upstash, or a hosted bot-protection service would be appropriate.

### P2: Magic Links Are In Query Strings And Are Reused For PDF Downloads

Magic links are intentionally stateless and valid for one hour. The same token is also appended to the PDF download URL. Query-string tokens are commonly recorded in browser history, reverse-proxy logs, platform logs, and analytics if added later.

Recommendation: after the user opens `/claim?token=...`, exchange the token for an HttpOnly, SameSite cookie scoped to the claim site, then remove the token from subsequent links and PDF downloads.

### P2: PDF Asset Loading Trusts Request Origin

The PDF renderer fetches static font/logo assets from `new URL(path, origin)`, where `origin` comes from `request.url`. In managed hosting this is usually stable, but it is still better to base internal asset loading on a configured trusted origin.

Recommendation: use a trusted asset origin from environment configuration, or return to local file reads with deployment tracing configured explicitly.

### P2: Dependency Audit Reports A Moderate PostCSS Advisory

`pnpm audit --audit-level moderate` reports `postcss <8.5.10` through `next@16.2.9`.

Recommendation: add a package-manager override to force patched `postcss >=8.5.10`, or upgrade Next once its dependency tree is patched.

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
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass.

