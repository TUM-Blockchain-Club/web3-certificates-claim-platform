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
  console.error("Usage: pnpm import:participants -- /absolute/path/to/file.csv");
  process.exit(1);
}

const requiredEnv = [
  "DATABASE_URL",
  "CERTIFICATE_NAME",
  "CERTIFICATE_COHORT",
  "CERTIFICATE_ISSUED_ON",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
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
  .map((row) => ({
    email: String(row[2] ?? "").trim(),
    name: String(row[0] ?? "").trim(),
    status: String(row[1] ?? "").trim(),
  }))
  .filter((row) => row.status === "Active (YES)" && row.name && row.email);

if (dryRun) {
  console.log(`Active participants: ${activeRows.length}`);
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
  ssl: "require",
});

let insertedOrUpdated = 0;

try {
  await sql.begin(async (tx) => {
    for (const row of activeRows) {
      await tx`
        insert into public.certificate_recipients (
          certificate_id,
          cohort,
          certificate_name,
          participant_name,
          email,
          email_normalized,
          source_status,
          certificate_issued_on
        )
        values (
          ${createCertificateId()},
          ${process.env.CERTIFICATE_COHORT},
          ${process.env.CERTIFICATE_NAME},
          ${row.name},
          ${row.email},
          ${normalizeEmail(row.email)},
          'Active (YES)',
          ${process.env.CERTIFICATE_ISSUED_ON}
        )
        on conflict (email_normalized)
        do update set
          cohort = excluded.cohort,
          certificate_name = excluded.certificate_name,
          participant_name = excluded.participant_name,
          email = excluded.email,
          source_status = excluded.source_status,
          certificate_issued_on = excluded.certificate_issued_on,
          verification_active = true,
          updated_at = now()
      `;
      insertedOrUpdated += 1;
    }

    await tx`
      insert into public.certificate_audit_events (
        event_type,
        metadata
      )
      values (
        'participants_imported',
        ${tx.json({
          activeRows: activeRows.length,
          sourceFile: csvPath,
        })}
      )
    `;
  });
} finally {
  await sql.end();
}

console.log(`Imported ${insertedOrUpdated} active participants.`);
