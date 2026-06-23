# Web3 Certificates Claim Platform

Temporary claim platform for Web3 Talents cohort 1 certificates.

Site name: `Web3 Certificate`

Production domain:

```text
https://claim-platform.web3-talents.com
```

Permanent verification domain:

```text
https://certificates.web3-talents.com
```

## Scope

This application:

- accepts an email address;
- sends a one-hour stateless magic link through Mailgun when the email belongs to an active participant;
- lets the participant download an on-demand PDF certificate;
- lets the participant submit a TBC NFT destination preference.

It does not mint NFTs and does not store generated PDFs.

## Local Development

Use `pnpm`.

```bash
pnpm install
pnpm dev
```

Required environment variables are documented in `.env.example`. Keep `.env` uncommitted.

The runtime app uses the Supabase REST API with a server-only secret key. The
Postgres `DATABASE_URL` should be a Supabase pooler URL and is only for
migration/import scripts.

Certificate name, cohort, and issue date are stored per recipient in Supabase.
New participant imports use database defaults for those fields.

## Database

Apply the schema:

```bash
pnpm db:migrate
```

Import active participants from the cohort CSV:

```bash
pnpm import:participants -- "/absolute/path/to/Cohort_Jan2026_Management_Sheet.xlsx - All Participants NEW.csv"
```

Only rows whose status column is `Active (YES)` are imported.

Preview the CSV selection without touching the database:

```bash
pnpm import:participants -- --dry-run "/absolute/path/to/Cohort_Jan2026_Management_Sheet.xlsx - All Participants NEW.csv"
```

## Checks

```bash
pnpm typecheck
pnpm build
```
