# Database

The claim platform owns the shared Supabase schema for certificates.

## Tables

- `public.certificate_recipients`: active certificate recipients imported from the cohort CSV.
- `public.certificate_nft_preferences`: one NFT destination preference per recipient.
- `public.certificate_audit_events`: minimal operational audit events.

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

