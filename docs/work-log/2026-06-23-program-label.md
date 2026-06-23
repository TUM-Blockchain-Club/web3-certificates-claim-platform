# 2026-06-23 Program Label Update

## Change

Renamed the displayed cohort/program label from `Cohort 1` to `Blockchain Fundamentals 1`.

## Scope

- Claim homepage kicker now uses `Blockchain Fundamentals 1`.
- Supabase migration `202606230001_rename_cohort_to_blockchain_fundamentals_1.sql` changes the `certificate_recipients.cohort` default and updates existing `Cohort 1` recipient rows.
- Claim page, PDF generation, and public verification pages already read the value from Supabase, so they pick up the new label after migration.
