# Agent Guide

## Project Structure

- `app/`: Next.js App Router pages and route handlers.
- `app/page.tsx`: public email entry flow.
- `app/claim/page.tsx`: magic-link claim page.
- `app/api/certificates/[certificateId]/pdf/route.ts`: on-demand PDF certificate download.
- `app/_components/`: client form components.
- `lib/`: environment validation, database access, Mailgun, magic links, PDF generation, and wallet validation.
- `supabase/migrations/`: shared Supabase schema used by this claim app and the permanent verification site.
- `scripts/`: tracked migrations, Program Run imports, name derivation, and private Issuance Manifest export.
- `public/certificate-assets/fonts/`: embedded fonts used for generated PDFs.
- `public/certificate-assets/templates/`: static PDF certificate templates used as the base for generated PDFs.
- `docs/`: implementation notes for future agents.

## Shared Schema Contract

- This repository owns the Supabase schema and exports the private Issuance
  Manifest consumed by the sibling `w3t-nfts` repository.
- Any Supabase change involving Programs, Program Runs, Recipients, Credentials,
  NFT preferences, issuances, verification views, or manifest fields must be
  checked against `w3t-nfts` in the same change.
- Update both repositories' validators, scripts, tests, `README.md`, and
  `AGENTS.md` whenever their shared schema or manifest contract changes.
- Keep the public verification view's compatibility with
  `web3-certificates-verify` unless that repository is updated in the same
  rollout.

## Conventions

- Use `pnpm` for all Node.js work.
- Do not commit `.env`, Supabase credentials, Mailgun keys, participant CSVs, or generated PDFs.
- Keep generated PDFs on demand only.
- Runtime app code should use the Supabase API client, not a direct Postgres connection. Keep `DATABASE_URL` for migration/import scripts only.
- Legacy prototype tables `web3_talents` and `web3_mentors` may exist in Supabase, but they are not used by this maintained certificate flow and should stay locked down with RLS.
- Keep magic links stateless and signed; do not add a token table unless requirements change.
- Keep link validity at one hour.
- Do not expose whether an email address exists in the public request flow.
- Keep claim-link rate limiting enabled before recipient lookup or Mailgun sending.
- Validate participant-owned NFT destinations as EVM addresses.
- NFT minting is out of scope. Export a frozen private Issuance Manifest for
  `w3t-nfts`; never place signing keys or mint execution in this web app.
- Recipient list editing happens directly in Supabase; do not add an admin UI in v1.
- Pass an explicit `--run <program-run-id>` to recipient import and replacement
  scripts. Preview replacements before applying them.
- Recipients and Credentials are separate records. Participant replacement must
  only inactivate participant Credentials in the selected Program Run; it must
  not delete Recipients or alter mentor Credentials.
- Preserve full names for protected PDFs. Public NFT and verification artifacts
  use the reviewed `public_display_name`, derived as preferred first name plus
  family-name initial.
- Preview issuance names with `pnpm export:issuance -- --run <id> --preview`
  before exporting a private manifest.
- Import confirmed `w3t-nfts` receipts with `pnpm import:issuance`; the import is
  checksummed and idempotent by transaction hash.
- Keep the visual theme and generated PDF aligned with the official TUM Blockchain Club dark violet palette from the website repo: background `#03000b`, accent `#672eb3`, highlight `#c29fff`.
- The public site name is `Web3 Certificate`.

## Product Naming

Use these spellings consistently:

- Web3 Talents
- Web3 Talents Certificate
- Blockchain Fundamentals 1
- TBC NFT
- Tum Blockchain Club
