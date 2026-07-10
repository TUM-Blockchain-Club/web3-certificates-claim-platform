#!/usr/bin/env node

import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("Missing required environment variable: DATABASE_URL");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  connect_timeout: 10,
  idle_timeout: 20,
  max: 1,
  prepare: false,
  ssl: "require",
});

try {
  await sql`
    create table if not exists public.certificate_schema_migrations (
      filename text primary key,
      checksum_sha256 text not null,
      applied_at timestamptz not null default now(),
      constraint certificate_schema_migrations_checksum_format
        check (checksum_sha256 ~ '^[0-9a-f]{64}$')
    )
  `;
  await sql`alter table public.certificate_schema_migrations enable row level security`;
  await sql`revoke all on table public.certificate_schema_migrations from anon, authenticated`;

  const migrationsDir = "supabase/migrations";
  const migrations = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const filename of migrations) {
    const migration = await readFile(join(migrationsDir, filename), "utf8");
    const checksum = createHash("sha256").update(migration).digest("hex");
    const [applied] = await sql`
      select checksum_sha256
      from public.certificate_schema_migrations
      where filename = ${filename}
    `;

    if (applied) {
      if (applied.checksum_sha256 !== checksum) {
        throw new Error(`Applied migration changed on disk: ${filename}`);
      }

      console.log(`Skipping ${filename}`);
      continue;
    }

    console.log(`Applying ${filename}`);
    await sql.begin(async (tx) => {
      await tx.unsafe(migration);
      await tx`
        insert into public.certificate_schema_migrations (
          filename,
          checksum_sha256
        )
        values (${filename}, ${checksum})
      `;
    });
  }
} finally {
  await sql.end();
}
