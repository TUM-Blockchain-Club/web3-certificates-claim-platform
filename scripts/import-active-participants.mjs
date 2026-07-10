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
    "Usage: pnpm import:participants -- --run <program-run-id> [--dry-run] /absolute/path/to/file.csv",
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
const rows = parse(content, {
  relax_column_count: true,
  skip_empty_lines: true,
});
const participantRows = rows.slice(2);
const statusCounts = new Map();

for (const row of participantRows) {
  const status = String(row[1] ?? "").trim() || "(blank)";
  statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
}

const activeRows = participantRows
  .filter(
    (row) =>
      String(row[1] ?? "").trim() === "Active (YES)" &&
      String(row[0] ?? "").trim() &&
      normalizeEmail(String(row[2] ?? "")).includes("@"),
  )
  .map((row) => ({
    email: normalizeEmail(String(row[2] ?? "")),
    name: derivePublicName(String(row[0] ?? "")),
    status: "Active (YES)",
  }));

if (dryRun) {
  console.log(`Active participants: ${activeRows.length}`);
  console.log(
    activeRows
      .map((row) => `${row.name.publicDisplayName} | ${row.email}`)
      .join("\n"),
  );
  console.log(
    [...statusCounts.entries()]
      .map(([status, count]) => `${status}: ${count}`)
      .join("\n"),
  );
  process.exit(0);
}

const sql = postgres(process.env.DATABASE_URL, {
  connect_timeout: 10,
  idle_timeout: 20,
  max: 3,
  prepare: false,
  ssl: "require",
});

try {
  const [programRun] = await sql`
    select id
    from public.certificate_program_runs
    where id = ${programRunId}
  `;

  if (!programRun) {
    throw new Error(`Unknown Program Run: ${programRunId}`);
  }

  await sql.begin(async (tx) => {
    for (const row of activeRows) {
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
          public_display_name = excluded.public_display_name,
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

    await tx`
      insert into public.certificate_audit_events (event_type, metadata)
      values (
        'participants_imported',
        ${tx.json({
          activeRows: activeRows.length,
          programRunId,
          sourceFile: csvPath,
        })}
      )
    `;
  });
} finally {
  await sql.end();
}

console.log(`Imported ${activeRows.length} active participants into ${programRunId}.`);
