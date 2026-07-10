#!/usr/bin/env node

import "dotenv/config";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import postgres from "postgres";
import { derivePublicName } from "./lib/names.mjs";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const dryRun = args.includes("--dry-run");
const runIndex = args.indexOf("--run");
const programRunId = runIndex >= 0 ? args[runIndex + 1] : null;
const csvPath = args.find(
  (arg, index) =>
    arg !== "--dry-run" && arg !== "--run" && index !== runIndex + 1,
);

if (!csvPath || !programRunId) {
  console.error(
    "Usage: pnpm replace:participants -- --run <program-run-id> [--dry-run] /absolute/path/to/file.csv",
  );
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

if (parsedRows.length === 0) {
  throw new Error("Recipient CSV is empty.");
}

const rows = parsedRows.map((row, index) => {
  const name = derivePublicName(String(row[0] ?? ""));
  const email = normalizeEmail(String(row[1] ?? ""));

  if (!email.includes("@")) {
    throw new Error(`Invalid recipient email at CSV line ${index + 1}`);
  }

  if (row.length > 2 && row.slice(2).some((value) => String(value ?? "").trim())) {
    throw new Error(`Unexpected extra columns at CSV line ${index + 1}`);
  }

  return { email, name };
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
    select
      r.email_normalized,
      r.full_name,
      r.public_display_name,
      c.certificate_id
    from public.certificate_credentials c
    join public.certificate_recipients r on r.id = c.recipient_id
    where c.program_run_id = ${programRunId}
      and c.credential_type = 'participant'
      and c.source_status = 'Active'
    order by r.email_normalized
  `;
  const existingEmails = new Set(existingRows.map((row) => row.email_normalized));
  const inactiveRows = existingRows.filter(
    (row) => !seenEmails.has(row.email_normalized),
  );
  const insertedRows = rows.filter((row) => !existingEmails.has(row.email));
  const updatedRows = rows.filter((row) => existingEmails.has(row.email));

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          csvRows: rows.length,
          inactivateCount: inactiveRows.length,
          inactiveRows,
          insertCount: insertedRows.length,
          insertedRows: insertedRows.map(({ email, name }) => ({
            email,
            fullName: name.fullName,
            publicDisplayName: name.publicDisplayName,
          })),
          programRunId,
          updateCount: updatedRows.length,
          updatedRows: updatedRows.map(({ email, name }) => ({
            email,
            fullName: name.fullName,
            publicDisplayName: name.publicDisplayName,
          })),
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  await sql.begin(async (tx) => {
    for (const row of rows) {
      const [recipient] = await tx`
        insert into public.certificate_recipients (
          full_name,
          preferred_first_name,
          family_name,
          public_display_name,
          email,
          email_normalized
        )
        values (
          ${row.name.fullName},
          ${row.name.preferredFirstName},
          ${row.name.familyName},
          ${row.name.publicDisplayName},
          ${row.email},
          ${row.email}
        )
        on conflict (email_normalized)
        do update set
          full_name = excluded.full_name,
          preferred_first_name = excluded.preferred_first_name,
          family_name = excluded.family_name,
          public_display_name = case
            when public.certificate_recipients.public_display_name_overridden
              then public.certificate_recipients.public_display_name
            else excluded.public_display_name
          end,
          email = excluded.email,
          updated_at = now()
        returning id
      `;

      await tx`
        insert into public.certificate_credentials (
          recipient_id,
          program_run_id,
          certificate_id,
          credential_type,
          certificate_name,
          issued_on,
          source_status,
          verification_active
        )
        values (
          ${recipient.id},
          ${programRunId},
          ${createCertificateId()},
          'participant',
          'Web3 Talents Certificate',
          current_date,
          'Active',
          true
        )
        on conflict (recipient_id, program_run_id, credential_type)
        do update set
          source_status = 'Active',
          verification_active = true,
          updated_at = now()
      `;
    }

    const csvEmails = rows.map((row) => row.email);
    await tx`
      update public.certificate_credentials c
      set
        source_status = 'Inactive',
        verification_active = false,
        updated_at = now()
      from public.certificate_recipients r
      where c.recipient_id = r.id
        and c.program_run_id = ${programRunId}
        and c.credential_type = 'participant'
        and r.email_normalized not in ${tx(csvEmails)}
    `;

    await tx`
      insert into public.certificate_audit_events (event_type, metadata)
      values (
        'participants_replaced',
        ${tx.json({
          csvRows: rows.length,
          inactivatedEmails: inactiveRows.map((row) => row.email_normalized),
          insertCount: insertedRows.length,
          programRunId,
          sourceFile: csvPath,
          updateCount: updatedRows.length,
        })}
      )
    `;
  });

  console.log(
    JSON.stringify(
      {
        inactivated: inactiveRows.length,
        inserted: insertedRows.length,
        programRunId,
        updated: updatedRows.length,
      },
      null,
      2,
    ),
  );
} finally {
  await sql.end();
}
