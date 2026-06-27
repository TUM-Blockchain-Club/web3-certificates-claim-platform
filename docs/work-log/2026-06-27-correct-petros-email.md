# Correct Petros Email

## Change

Corrected the certificate recipient email for Petros Lekkos in Supabase:

- old: `petroscf@hotmail.com`
- new: `petroscf@hotmail.gr`

The existing `certificate_recipients.id` and `certificate_id` were preserved, so the verification URL remains unchanged.

## Verification

After the update, Supabase contains exactly one matching recipient row for Petros Lekkos with `email_normalized = 'petroscf@hotmail.gr'`.

An audit event was inserted into `public.certificate_audit_events` with event type `recipient_email_corrected`.
