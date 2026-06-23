# 2026-06-23 Claim Layout Fix

## Change

Hardened the claim homepage layout after a live screenshot showed the old large headline overflowing from the intro panel into the email form panel.

## Details

- Increased the desktop intro-column minimum width.
- Reduced the desktop `h1` clamp and capped it by character width.
- Added intermediate desktop sizing for narrower laptop windows.
- Made metadata rows grid-based so long values do not push the panel width.
- Added small-screen metadata stacking.

The live screenshot was still from an old deployment, but these changes keep the current dark-theme version more robust after redeploy.
