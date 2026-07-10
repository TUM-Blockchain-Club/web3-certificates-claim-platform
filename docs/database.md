# Certificate Database

## Ownership

The claim platform owns the shared Supabase schema. The NFT pipeline in
`w3t-nfts` consumes frozen Issuance Manifests exported from this database.
Schema and manifest changes must be coordinated across both repositories.

## Core Tables

- `certificate_programs`: durable educational programs.
- `certificate_program_runs`: fixed iterations of a Program.
- `certificate_recipients`: private person and contact data, including full and
  structured names.
- `certificate_credentials`: one participant or mentor attestation for one
  Recipient and Program Run.
- `certificate_nft_preferences`: one NFT destination preference per Credential.
- `certificate_issuances`: on-chain token history imported from completed mint
  receipts, including replacements and revocations.
- `certificate_audit_events`: security and operational audit records.
- `certificate_rate_limits`: hashed public request counters.
- `certificate_schema_migrations`: immutable migration checksums.

Foreign-key columns used for joins and cascades are indexed. RLS is enabled on
private tables, and runtime access uses the server-only service-role client.

## Names

`certificate_recipients.full_name` remains private and is used for protected
PDFs. Imports derive `preferred_first_name`, `family_name`, and
`public_display_name`; the public form is `Preferred F.` and can be corrected in
Supabase before a batch is frozen. Set `public_display_name_overridden = true`
for reviewed exceptions so later imports preserve the correction.

The public verification view preserves its existing field names but maps
`participant_name` to the privacy-minimized `public_display_name`.

## Issuance Boundary

`pnpm export:issuance -- --run <id> --preview` lists mintable public names and
destinations. The output mode creates a private schema-versioned manifest and a
SHA-256 sidecar. The manifest is immutable input to `w3t-nfts`; it is not stored
in Git.

## Migration Rollout

The reusable Credential migration changes the runtime table layout. Apply it in
coordination with deployment of the matching claim-platform code. Do not apply
it independently while an older production build is still serving requests.
