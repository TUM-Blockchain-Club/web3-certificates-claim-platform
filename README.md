# Web3 Certificates Claim Platform

Temporary claim platform for Web3 Talents Blockchain Fundamentals 1 certificates.

Site name: `Web3 Certificate`

Production domain:

```text
https://claim-platform.web3-talents.com
```

Permanent verification domain:

```text
https://certificates.web3-talents.com
```

Issuance documentation boundaries are described in
`docs/issuance/README.md`; concrete batch status remains local-only.

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

Certificate name, cohort, issue date, and certificate type are stored per
Credential in Supabase. Recipients are stored separately so the same person can
receive participant and mentor Credentials across multiple Program Runs.
Supported Credential types are `participant` and `mentor`.

## Shared Schema Contract

This repository owns the shared Supabase schema and the private Issuance
Manifest export consumed by the sibling `w3t-nfts` repository. Any change to
recipient, Credential, Program Run, NFT preference, issuance, public
verification view, or manifest fields must be reviewed in both repositories.
Update the matching types, validators, scripts, tests, `README.md`, and
`AGENTS.md` in `w3t-nfts` in the same coordinated change.

Do not make the NFT pipeline query mutable recipient rows while minting. Export
and archive a frozen manifest first.

## Database

Apply the schema:

```bash
pnpm db:migrate
```

Import active participants from the cohort CSV:

```bash
pnpm import:participants -- --run blockchain-fundamentals-1 "/absolute/path/to/Cohort_Jan2026_Management_Sheet.xlsx - All Participants NEW.csv"
```

Only rows whose status column is `Active (YES)` are imported.

Replace the full certificate recipient list from a two-column `name,email` CSV:

```bash
pnpm replace:participants -- --run blockchain-fundamentals-1 "/absolute/path/to/People receiving a certificate - Sheet1.csv"
```

Preview the replacement without touching the database:

```bash
pnpm replace:participants -- --run blockchain-fundamentals-1 --dry-run "/absolute/path/to/People receiving a certificate - Sheet1.csv"
```

The replacement script only modifies rows with `certificate_type = 'participant'`.
Mentor certificates are kept in the same table with `certificate_type = 'mentor'`.

Preview the CSV selection without touching the database:

```bash
pnpm import:participants -- --run blockchain-fundamentals-1 --dry-run "/absolute/path/to/Cohort_Jan2026_Management_Sheet.xlsx - All Participants NEW.csv"
```

Preview the exact shortened public names and destinations that are currently
eligible for an NFT:

```bash
pnpm export:issuance -- --run blockchain-fundamentals-1 --preview
```

The exporter rejects names that do not use the reviewed first-name plus
family-initial format. Full recipient names remain available only to protected
PDF generation and are never written to the Issuance Manifest.

After review, export a frozen private manifest outside Git:

```bash
pnpm export:issuance -- --run blockchain-fundamentals-1 --output private/blockchain-fundamentals-1.json
```

The export resolves `tbc_wallet` preferences to `TBC_CUSTODY_WALLET`, writes the
manifest with mode `0600`, and writes a SHA-256 sidecar. Do not export until the
display-name preview has been approved.

After a Polygon batch completes in `w3t-nfts`, import its confirmed, checksummed
receipts idempotently:

```bash
pnpm import:issuance -- --receipts private/blockchain-fundamentals-1-receipts.json
```

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test:scripts
pnpm build
```
