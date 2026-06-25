# 2026-06-25 Mobile Claim Layout

## Change

Tightened the mobile claim page layout.

The claim page now uses a dedicated `claim-name` class for participant names so
longer names wrap predictably without touching the card edge. Mobile styles also
adjust the claim card width, padding, action button grid, summary rows, and NFT
radio options for narrow phone screens.

## Verification

Ran:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

Served the production build locally and confirmed Sai Kommalapati's claim page
returned `200` with the updated `claim-name`, `certificate-summary`, and
`actions` markup.

