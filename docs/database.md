# Database

The claim platform owns the shared Supabase schema for certificates.

## Tables

- `public.certificate_recipients`: active certificate recipients imported from the cohort CSV.
- `public.certificate_nft_preferences`: one NFT destination preference per recipient.
- `public.certificate_audit_events`: minimal operational audit events.
- `public.certificate_rate_limits`: hashed request counters for claim-link abuse prevention.
- `public.certificate_public_verifications`: public verification view consumed by the permanent verification site.

`cohort`, `certificate_name`, and `certificate_issued_on` live on each
recipient row. New imports rely on Supabase defaults:

- `cohort`: `Blockchain Fundamentals 1`
- `certificate_name`: `Web3 Talents Certificate`
- `certificate_issued_on`: `current_date` at first insert

## Privacy

The public email form always returns the same response. It must not reveal whether an email exists.

The permanent verification site reveals only data associated with a random certificate ID:

- participant name;
- certificate name;
- cohort;
- issue date;
- validity status.

## Token Handling

Magic links are not stored. The signed payload contains only recipient ID, issued-at timestamp, and expiry timestamp.

## Rate Limiting

Claim-link requests are limited with `public.consume_certificate_rate_limit`.
The application hashes email and IP keys with `MAGIC_LINK_SECRET` before sending
them to Supabase, so the rate-limit table does not store raw email addresses or
IP addresses.
