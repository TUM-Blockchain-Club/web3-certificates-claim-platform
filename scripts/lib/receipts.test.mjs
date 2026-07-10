import assert from "node:assert/strict";
import test from "node:test";
import { validateMintReceipts } from "./receipts.mjs";

function exampleReceipts() {
  return {
    schemaVersion: 1,
    sourceManifestSha256: "a".repeat(64),
    chainId: 137,
    contractAddress: `0x${"1".repeat(40)}`,
    entries: {
      abcdefghijklmnop: {
        certificateId: "abcdefghijklmnop",
        issuedAt: "2026-07-10T12:00:00.000Z",
        metadataUri: "ipfs://bafkreibimiqt7hoymvj3x5qzhwzbobudhogn4enulxxqteqk6hp3xllwty",
        recipientAddress: `0x${"2".repeat(40)}`,
        status: "minted",
        tokenId: "1",
        transactionHash: `0x${"3".repeat(64)}`,
      },
      pending: {
        status: "submitted",
      },
    },
  };
}

test("accepts confirmed receipts and ignores submitted transactions", () => {
  const receipts = validateMintReceipts(exampleReceipts());
  assert.equal(receipts.chainId, 137);
  assert.equal(receipts.entries.length, 1);
  assert.equal(receipts.entries[0].certificateId, "abcdefghijklmnop");
});

test("rejects malformed transaction hashes", () => {
  const input = exampleReceipts();
  input.entries.abcdefghijklmnop.transactionHash = "0x1234";
  assert.throws(() => validateMintReceipts(input), /transactionHash is invalid/);
});
