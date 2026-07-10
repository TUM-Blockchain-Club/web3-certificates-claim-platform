import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const ADDRESS_PATTERN = /^0x[0-9A-Fa-f]{40}$/;
const CERTIFICATE_ID_PATTERN = /^[A-Za-z0-9_-]{16,80}$/;
const HASH_PATTERN = /^0x[0-9A-Fa-f]{64}$/;
const IPFS_URI_PATTERN = /^ipfs:\/\/(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,})$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function requirePattern(value, pattern, context) {
  const normalized = String(value ?? "").trim();
  if (!pattern.test(normalized)) {
    throw new Error(`${context} is invalid.`);
  }
  return normalized;
}

export async function loadChecksummedReceipts(receiptsPath) {
  const [content, expectedChecksum] = await Promise.all([
    readFile(receiptsPath, "utf8"),
    readFile(`${receiptsPath}.sha256`, "utf8"),
  ]);
  const checksum = createHash("sha256").update(content).digest("hex");
  if (checksum !== expectedChecksum.trim()) {
    throw new Error(`Checksum mismatch for ${receiptsPath}.`);
  }
  return JSON.parse(content);
}

export function validateMintReceipts(receipts) {
  if (receipts.schemaVersion !== 1 || !receipts.entries || Array.isArray(receipts.entries)) {
    throw new Error("Mint receipts must use schemaVersion 1 and an entries object.");
  }
  if (!Number.isSafeInteger(receipts.chainId) || receipts.chainId < 1) {
    throw new Error("Mint receipts chainId is invalid.");
  }

  const contractAddress = requirePattern(
    receipts.contractAddress,
    ADDRESS_PATTERN,
    "Mint receipts contractAddress",
  );
  const manifestSha256 = requirePattern(
    receipts.sourceManifestSha256,
    SHA256_PATTERN,
    "Mint receipts sourceManifestSha256",
  );
  const entries = Object.values(receipts.entries)
    .filter((entry) => entry.status === "minted")
    .map((entry, index) => {
      const context = `Mint receipt ${index + 1}`;
      const tokenId = String(entry.tokenId ?? "");
      if (!/^\d+$/.test(tokenId)) {
        throw new Error(`${context} tokenId is invalid.`);
      }
      const issuedAt = String(entry.issuedAt ?? "");
      if (Number.isNaN(Date.parse(issuedAt))) {
        throw new Error(`${context} issuedAt is invalid.`);
      }

      const certificateId = requirePattern(
        entry.certificateId,
        CERTIFICATE_ID_PATTERN,
        `${context} certificateId`,
      );
      const metadataUri = requirePattern(
        entry.metadataUri,
        IPFS_URI_PATTERN,
        `${context} metadataUri`,
      );

      return {
        certificateId,
        issuedAt,
        metadataUri,
        recipientAddress: requirePattern(
          entry.recipientAddress,
          ADDRESS_PATTERN,
          `${context} recipientAddress`,
        ),
        tokenId,
        transactionHash: requirePattern(
          entry.transactionHash,
          HASH_PATTERN,
          `${context} transactionHash`,
        ),
      };
    });

  if (entries.length === 0) {
    throw new Error("Mint receipts contain no confirmed entries.");
  }

  return {
    chainId: receipts.chainId,
    contractAddress,
    entries,
    manifestSha256,
  };
}
