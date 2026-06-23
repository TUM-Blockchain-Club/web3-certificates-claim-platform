# 2026-06-23 Vercel Build Env Fix

## Problem

Vercel failed during `next build` while collecting page data for the PDF route because `lib/env.ts` parsed all required runtime secrets at module import time. The build environment did not have `SUPABASE_URL`, so importing route modules failed before deployment.

## Change

- `lib/env.ts` now validates each environment variable lazily when that property is read.
- `lib/supabase.ts` now creates the server Supabase client lazily when request-time code first uses it.

Runtime paths still fail fast if required variables are missing, but static build-time route imports no longer require Supabase or Mailgun secrets.

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- Temporarily moved `.env` out of the project and confirmed `pnpm build` still succeeds without local secrets.
