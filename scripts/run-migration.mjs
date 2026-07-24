#!/usr/bin/env node

import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { assertReusableCredentialLegacyBaseline } from "./lib/migration-baseline.mjs";

const adoptExistingLegacySchema = process.argv.includes("--adopt-existing-legacy-schema");

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

  if (adoptExistingLegacySchema) {
    const recipientColumns = await sql`
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = 'certificate_recipients'
      order by ordinal_position
    `;
    const verificationColumns = await sql`
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = 'certificate_public_verifications'
      order by ordinal_position
    `;
    const legacyWeb3Tables = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public' and table_name in ('web3_talents', 'web3_mentors')
      order by table_name
    `;
    const reusableTables = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'certificate_programs',
          'certificate_program_runs',
          'certificate_credentials',
          'certificate_issuances'
        )
      order by table_name
    `;
    assertReusableCredentialLegacyBaseline({
      legacyWeb3Tables: legacyWeb3Tables.map((row) => row.table_name),
      recipientColumns: recipientColumns.map((row) => row.column_name),
      reusableTables: reusableTables.map((row) => row.table_name),
      verificationColumns: verificationColumns.map((row) => row.column_name),
    });

    for (const filename of migrations.filter((file) => file < "202607100001_create_reusable_credential_model.sql")) {
      const migration = await readFile(join(migrationsDir, filename), "utf8");
      const checksum = createHash("sha256").update(migration).digest("hex");
      const [applied] = await sql`
        select checksum_sha256
        from public.certificate_schema_migrations
        where filename = ${filename}
      `;
      if (applied && applied.checksum_sha256 !== checksum) {
        throw new Error(`Applied migration changed on disk: ${filename}`);
      }
      if (!applied) {
        console.log(`Adopting ${filename}`);
        await sql`
          insert into public.certificate_schema_migrations (filename, checksum_sha256)
          values (${filename}, ${checksum})
        `;
      }
    }
  }

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
