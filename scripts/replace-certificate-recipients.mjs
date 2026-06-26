#!/usr/bin/env node

import "dotenv/config";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import postgres from "postgres";

const dryRun = process.argv.includes("--dry-run");
const csvPath = process.argv.find(
  (arg, index) => index > 1 && arg !== "--dry-run" && arg !== "--",
);

if (!csvPath) {
  console.error("Usage: pnpm replace:participants -- /absolute/path/to/file.csv");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Missing required environment variable: DATABASE_URL");
  process.exit(1);
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function createCertificateId() {
  return randomBytes(18).toString("base64url");
}

const content = await readFile(csvPath, "utf8");
const parsedRows = parse(content, {
  bom: true,
  columns: false,
  relax_column_count: true,
  skip_empty_lines: true,
  trim: true,
});

const rows = parsedRows.map((row, index) => {
  const name = String(row[0] ?? "").trim();
  const email = normalizeEmail(String(row[1] ?? ""));

  if (!name || !email || !email.includes("@")) {
    throw new Error(`Invalid recipient row at CSV line ${index + 1}`);
  }

  if (row.length > 2 && row.slice(2).some((value) => String(value ?? "").trim())) {
    throw new Error(`Unexpected extra columns at CSV line ${index + 1}`);
  }

  return {
    certificateId: createCertificateId(),
    email,
    name,
  };
});

const seenEmails = new Set();
for (const row of rows) {
  if (seenEmails.has(row.email)) {
    throw new Error(`Duplicate recipient email in CSV: ${row.email}`);
  }

  seenEmails.add(row.email);
}

const sql = postgres(process.env.DATABASE_URL, {
  connect_timeout: 10,
  idle_timeout: 20,
  max: 3,
  prepare: false,
  ssl: "require",
});

try {
  const existingRows = await sql`
    select email_normalized, participant_name, certificate_id
    from public.certificate_recipients
    order by email_normalized
  `;
  const csvEmails = rows.map((row) => row.email);
  const existingEmails = new Set(existingRows.map((row) => row.email_normalized));
  const deletedRows = existingRows.filter((row) => !seenEmails.has(row.email_normalized));
  const insertedRows = rows.filter((row) => !existingEmails.has(row.email));
  const updatedRows = rows.filter((row) => existingEmails.has(row.email));

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          csvRows: rows.length,
          deleteCount: deletedRows.length,
          deletedRows,
          insertCount: insertedRows.length,
          insertedRows: insertedRows.map(({ email, name }) => ({ email, name })),
          updateCount: updatedRows.length,
          updatedRows: updatedRows.map(({ email, name }) => ({ email, name })),
        },
        null,
        2,
      ),
    );
  } else {
    await sql.begin(async (tx) => {
      for (const row of rows) {
        await tx`
          insert into public.certificate_recipients (
            certificate_id,
            participant_name,
            email,
            email_normalized,
            source_status,
            verification_active
          )
          values (
            ${row.certificateId},
            ${row.name},
            ${row.email},
            ${row.email},
            'Active (YES)',
            true
          )
          on conflict (email_normalized)
          do update set
            participant_name = excluded.participant_name,
            email = excluded.email,
            source_status = excluded.source_status,
            verification_active = true,
            updated_at = now()
        `;
      }

      await tx`
        delete from public.certificate_recipients
        where email_normalized not in ${tx(csvEmails)}
      `;

      await tx`
        insert into public.certificate_audit_events (
          event_type,
          metadata
        )
        values (
          'participants_replaced',
          ${tx.json({
            csvRows: rows.length,
            deleteCount: deletedRows.length,
            deletedEmails: deletedRows.map((row) => row.email_normalized),
            insertCount: insertedRows.length,
            insertedEmails: insertedRows.map((row) => row.email),
            sourceFile: csvPath,
            updateCount: updatedRows.length,
          })}
        )
      `;
    });

    console.log(
      JSON.stringify(
        {
          csvRows: rows.length,
          deleted: deletedRows.length,
          inserted: insertedRows.length,
          updated: updatedRows.length,
        },
        null,
        2,
      ),
    );
  }
} finally {
  await sql.end();
}
