# 2026-06-22 Implementation

## Scope

Created the temporary Web3 Talents certificate claim platform for `claim-platform.web3-talents.com`.

## Decisions

- Certificates are generated on demand and not stored.
- PDF credibility is anchored to a permanent verification URL on `certificates.web3-talents.com`.
- Magic links are stateless HMAC-signed tokens with one-hour expiry.
- Participants can request multiple links; tokens are not consumed during the validity window.
- The import script only inserts CSV rows with status `Active (YES)`.
- NFT minting is out of scope. This app stores `evm_wallet`, `tbc_wallet`, or `none` preferences.

## Asset Sources

- `public/tbc-wordmark.png` from `/home/codex/projects/website/public/tbc-wordmark.png`
- `public/web3-talents-logo.png` from `/home/codex/projects/web3-talents-website/public/logo/black text/large.png`

