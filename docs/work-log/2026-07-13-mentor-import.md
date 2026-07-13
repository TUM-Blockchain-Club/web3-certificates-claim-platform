# Mentor Credential Import

## Production Change

Added seven active Mentor Credentials to the existing Supabase certificate
schema:

- Elchin Bayramov
- Moran Hertzanu Weiss
- Nikolas Hack
- Richard Mediavilla
- Sabrina Goerlich
- Sonny Dhamayana
- Susmita Das

The import used the supplied email addresses, including Richard's later
replacement address, without recording those addresses in Git. Every Credential
uses `2026-06-22` as its issuance date and a new cryptographically random public
Certificate ID.

## Verification

- Supabase contains 7 Mentor and 38 Participant Credentials.
- All Mentor Credentials are active in the public verification view.
- No supplied Mentor email conflicted with an existing Recipient.
- Mentor NFT preferences are initially absent and will be created by each
  Mentor through the normal claim flow.
