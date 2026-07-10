#!/usr/bin/env node

import "dotenv/config";
import postgres from "postgres";
import {
  loadChecksummedReceipts,
  validateMintReceipts,
} from "./lib/receipts.mjs";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const receiptsIndex = args.indexOf("--receipts");
const receiptsPath = receiptsIndex >= 0 ? args[receiptsIndex + 1] : null;

if (!receiptsPath) {
  console.error("Usage: pnpm import:issuance -- --receipts <private-receipts.json>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  throw new Error("Missing required environment variable: DATABASE_URL");
}

const receipts = validateMintReceipts(await loadChecksummedReceipts(receiptsPath));
const sql = postgres(process.env.DATABASE_URL, {
  connect_timeout: 10,
  idle_timeout: 20,
  max: 1,
  prepare: false,
  ssl: "require",
});

let imported = 0;
try {
  await sql.begin(async (tx) => {
    for (const entry of receipts.entries) {
      const [credential] = await tx`
        select id
        from public.certificate_credentials
        where certificate_id = ${entry.certificateId}
      `;
      if (!credential) {
        throw new Error(`Unknown Certificate ID in receipts: ${entry.certificateId}`);
      }

      const inserted = await tx`
        insert into public.certificate_issuances (
          credential_id,
          chain_id,
          contract_address,
          token_id,
          transaction_hash,
          recipient_address,
          metadata_uri,
          manifest_sha256,
          status,
          issued_at
        )
        values (
          ${credential.id},
          ${receipts.chainId},
          ${receipts.contractAddress},
          ${entry.tokenId},
          ${entry.transactionHash},
          ${entry.recipientAddress},
          ${entry.metadataUri},
          ${receipts.manifestSha256},
          'active',
          ${entry.issuedAt}
        )
        on conflict (transaction_hash) do nothing
        returning id
      `;
      imported += inserted.length;

      if (inserted.length === 0) {
        const [existing] = await tx`
          select
            credential_id,
            chain_id,
            contract_address,
            token_id,
            recipient_address,
            metadata_uri,
            manifest_sha256,
            status
          from public.certificate_issuances
          where transaction_hash = ${entry.transactionHash}
        `;
        if (
          !existing ||
          existing.credential_id !== credential.id ||
          Number(existing.chain_id) !== receipts.chainId ||
          existing.contract_address.toLowerCase() !== receipts.contractAddress.toLowerCase() ||
          String(existing.token_id) !== entry.tokenId ||
          existing.recipient_address.toLowerCase() !== entry.recipientAddress.toLowerCase() ||
          existing.metadata_uri !== entry.metadataUri ||
          existing.manifest_sha256 !== receipts.manifestSha256 ||
          existing.status !== "active"
        ) {
          throw new Error(`Existing issuance does not match receipt: ${entry.transactionHash}`);
        }
      }
    }

    await tx`
      insert into public.certificate_audit_events (event_type, metadata)
      values (
        'issuance_receipts_imported',
        ${tx.json({
          imported,
          manifestSha256: receipts.manifestSha256,
          receiptEntries: receipts.entries.length,
        })}
      )
    `;
  });
} finally {
  await sql.end();
}

console.log(`Imported ${imported}/${receipts.entries.length} confirmed issuance receipts.`);
