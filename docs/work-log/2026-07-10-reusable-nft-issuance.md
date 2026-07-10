# Reusable NFT Issuance Integration

## Scope

Prepared the claim platform to serve as the Supabase source for recurring Web3
Talents participant and mentor Credential issuance.

## Changes

- Split person/contact records from Program Run Credentials.
- Added Programs, Program Runs, structured public names, and on-chain issuance
  history.
- Kept the permanent verification view's field contract while changing its
  public name to the privacy-minimized display form.
- Made imports Program Run-specific and non-destructive across roles.
- Added a reviewed-name preview and private, checksummed Issuance Manifest
  export for `w3t-nfts`.
- Added migration checksum tracking so historical migrations are never silently
  modified or reapplied after the schema transition.
- Added an idempotent import for checksummed confirmed mint receipts so Supabase
  records active on-chain issuance history after each operational batch.
- Preserved explicitly marked display-name corrections across later CSV imports.

## Deployment Constraint

The migration and matching Next.js build must be rolled out together. The
migration is validated transactionally before production application and is not
applied as part of code inspection or tests.
