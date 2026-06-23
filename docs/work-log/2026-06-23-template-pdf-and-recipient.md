# 2026-06-23 Template PDF And Recipient Update

## Recipient

Added Damian Mayr as an active certificate recipient in Supabase:

- Name: `Damian Mayr`
- Email: `damian.mayr@tum-blockchain.com`
- Cohort/program: `Blockchain Fundamentals 1`
- Issued on: `2026-06-23`

## PDF Template

Switched PDF generation to use the provided `Certificate_C_withoutName (4).pdf`
as the base template.

The generator now overlays only dynamic content:

- participant name;
- certificate name;
- program label;
- issue date;
- issuer;
- certificate ID;
- QR code;
- verification URL.

The QR code scans to the public certificate verification URL. The verification
label is now above the QR code and the URL is aligned below the QR code in the
bottom-right area.

## Website Logo

Generated `public/web3-talents-logo-white.png` from the Web3 Talents logo source
with the black background removed and switched the site header to use that asset
directly on the dark theme.
