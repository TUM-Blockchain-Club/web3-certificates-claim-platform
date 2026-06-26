# 2026-06-26 Replace Recipients From CSV

## Source

Used the attached two-column CSV as the new source of truth:

`People receiving a certificate - Sheet1.csv`

The file has no header row. It was parsed as:

- column 1: participant name
- column 2: email

## Script

Added `scripts/replace-certificate-recipients.mjs` and package script
`pnpm replace:participants`.

The script:

- supports `--dry-run`;
- validates non-empty names and emails;
- rejects duplicate emails;
- preserves `certificate_id` for existing recipients with matching email;
- creates new random certificate IDs for new emails;
- deletes recipients whose email is not in the CSV;
- writes a `participants_replaced` audit event.

## Run

Dry-run result:

- CSV rows: 38
- updates: 32
- inserts: 6
- deletes: 16

Live replacement result:

- CSV rows: 38
- updated: 32
- inserted: 6
- deleted: 16

## Verification

After the replacement:

- `certificate_recipients` contains 38 rows;
- `certificate_public_verifications` returns 38 rows;
- no CSV email is missing in Supabase;
- no extra recipient email remains outside the CSV;
- `certificate_nft_preferences` is empty because previous preference owners are
  not part of the new CSV source of truth.

## Notes

The CSV contains `Manav GoyalD`. The database name normalizer stores this as
`Manav Goyald`. This was left unchanged because the CSV was defined as the
source of truth.

