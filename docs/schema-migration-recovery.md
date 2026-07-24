# Recover missing migration history

The production schema may survive while
`certificate_schema_migrations` is missing, for example after restoring or
reactivating an older Supabase project. Do not replay every historical
migration blindly.

For the specific completed legacy schema immediately before reusable
Credentials, run:

```bash
pnpm db:migrate -- --adopt-existing-legacy-schema
```

The runner first verifies the legacy recipient columns, verification-view
shape, removed prototype tables, and absence of reusable Credential tables. It
then records the matching June migration checksums and applies later migrations
normally. Any partial or ambiguous schema is rejected without adoption.
