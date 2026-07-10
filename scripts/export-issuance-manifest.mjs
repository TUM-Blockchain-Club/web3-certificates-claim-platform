#!/usr/bin/env node

import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import postgres from "postgres";

const EVM_ADDRESS_PATTERN = /^0x[0-9A-Fa-f]{40}$/;
const args = process.argv.slice(2).filter((arg) => arg !== "--");
const preview = args.includes("--preview");
const runIndex = args.indexOf("--run");
const outputIndex = args.indexOf("--output");
const programRunId = runIndex >= 0 ? args[runIndex + 1] : null;
const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : null;

if (!programRunId || (!preview && !outputPath)) {
  console.error(
    "Usage: pnpm export:issuance -- --run <program-run-id> (--preview | --output <private-path>)",
  );
  process.exit(1);
}

for (const key of ["DATABASE_URL", "CERTIFICATES_BASE_URL"]) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const sql = postgres(process.env.DATABASE_URL, {
  connect_timeout: 10,
  idle_timeout: 20,
  max: 1,
  prepare: false,
  ssl: "require",
});

try {
  const rows = await sql`
    select
      p.id as program_id,
      p.name as program_name,
      pr.id as program_run_id,
      pr.label as program_run_label,
      c.certificate_id,
      c.credential_type,
      c.certificate_name,
      c.issued_on,
      r.public_display_name,
      pref.destination_type,
      pref.evm_address
    from public.certificate_credentials c
    join public.certificate_recipients r on r.id = c.recipient_id
    join public.certificate_program_runs pr on pr.id = c.program_run_id
    join public.certificate_programs p on p.id = pr.program_id
    join public.certificate_nft_preferences pref on pref.credential_id = c.id
    where c.program_run_id = ${programRunId}
      and c.source_status = 'Active'
      and c.verification_active = true
      and pref.destination_type in ('evm_wallet', 'tbc_wallet')
      and not exists (
        select 1
        from public.certificate_issuances i
        where i.credential_id = c.id
          and i.status = 'active'
      )
    order by r.public_display_name, c.credential_type, c.certificate_id
  `;

  if (rows.length === 0) {
    throw new Error(`No mintable Credentials found for ${programRunId}.`);
  }

  if (preview) {
    console.log(`Mintable Credentials for ${programRunId}: ${rows.length}`);
    for (const [index, row] of rows.entries()) {
      console.log(
        `${String(index + 1).padStart(2, " ")}. ${row.public_display_name} | ${row.credential_type} | ${row.destination_type}`,
      );
    }
    process.exit(0);
  }

  const custodyWallet = process.env.TBC_CUSTODY_WALLET;
  if (!custodyWallet || !EVM_ADDRESS_PATTERN.test(custodyWallet)) {
    throw new Error("TBC_CUSTODY_WALLET must be a valid EVM address.");
  }

  const first = rows[0];
  const manifest = {
    schemaVersion: 1,
    batchId: randomUUID(),
    createdAt: new Date().toISOString(),
    program: {
      id: first.program_id,
      name: first.program_name,
    },
    programRun: {
      id: first.program_run_id,
      label: first.program_run_label,
    },
    entries: rows.map((row) => ({
      certificateId: row.certificate_id,
      certificateName: row.certificate_name,
      credentialType: row.credential_type,
      destinationAddress:
        row.destination_type === "tbc_wallet" ? custodyWallet : row.evm_address,
      destinationType: row.destination_type,
      issuedOn: String(row.issued_on).slice(0, 10),
      publicDisplayName: row.public_display_name,
      verificationUrl: new URL(
        `/verify/${encodeURIComponent(row.certificate_id)}`,
        process.env.CERTIFICATES_BASE_URL,
      ).toString(),
    })),
  };
  const content = `${JSON.stringify(manifest, null, 2)}\n`;
  const checksum = createHash("sha256").update(content).digest("hex");
  const absoluteOutputPath = resolve(outputPath);

  await mkdir(dirname(absoluteOutputPath), { recursive: true });
  await writeFile(absoluteOutputPath, content, { mode: 0o600 });
  await writeFile(`${absoluteOutputPath}.sha256`, `${checksum}\n`, { mode: 0o600 });

  console.log(`Wrote ${manifest.entries.length} Credentials to ${absoluteOutputPath}`);
  console.log(`SHA-256: ${checksum}`);
} finally {
  await sql.end();
}
