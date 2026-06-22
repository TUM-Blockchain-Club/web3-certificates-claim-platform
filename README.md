# Web3 Certificates Claim Platform

Temporary claim platform for Web3 Talents cohort 1 certificates.

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

## Checks

```bash
pnpm typecheck
pnpm build
```

