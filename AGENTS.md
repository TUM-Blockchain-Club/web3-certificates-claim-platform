# Agent Guide

## Project Structure

- `app/`: Next.js App Router pages and route handlers.
- `app/page.tsx`: public email entry flow.
- `app/claim/page.tsx`: magic-link claim page.
- `app/api/certificates/[certificateId]/pdf/route.ts`: on-demand PDF certificate download.
- `app/_components/`: client form components.
- `lib/`: environment validation, database access, Mailgun, magic links, PDF generation, and wallet validation.
- `supabase/migrations/`: shared Supabase schema used by this claim app and the permanent verification site.
- `scripts/`: operational scripts, including active participant import.
- `public/certificate-assets/fonts/`: embedded fonts used for generated PDFs.
- `docs/`: implementation notes for future agents.

## Conventions

- Use `pnpm` for all Node.js work.
- Do not commit `.env`, Supabase credentials, Mailgun keys, participant CSVs, or generated PDFs.
- Keep generated PDFs on demand only.
- Keep magic links stateless and signed; do not add a token table unless requirements change.
- Keep link validity at one hour.
- Do not expose whether an email address exists in the public request flow.
- Validate participant-owned NFT destinations as EVM addresses.
- NFT minting is out of scope; store only the preference for a separate minting project.
- Recipient list editing happens directly in Supabase; do not add an admin UI in v1.

## Product Naming

Use these spellings consistently:

- Web3 Talents
- Web3 Talents Certificate
- Cohort 1
- TBC NFT
- Tum Blockchain Club
