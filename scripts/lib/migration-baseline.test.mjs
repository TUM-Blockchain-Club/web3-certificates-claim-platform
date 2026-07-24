import assert from "node:assert/strict";
import test from "node:test";
import { assertReusableCredentialLegacyBaseline } from "./migration-baseline.mjs";

function legacySnapshot() {
  return {
    legacyWeb3Tables: [],
    recipientColumns: [
      "certificate_id",
      "certificate_type",
      "participant_name",
    ],
    reusableTables: [],
    verificationColumns: [
      "certificate_id",
      "cohort",
      "certificate_name",
      "participant_name",
      "certificate_issued_on",
      "certificate_type",
    ],
  };
}

test("accepts the completed legacy schema before reusable Credentials", () => {
  assert.doesNotThrow(() => assertReusableCredentialLegacyBaseline(legacySnapshot()));
});

test("rejects an ambiguous partial legacy schema", () => {
  const snapshot = legacySnapshot();
  snapshot.recipientColumns = snapshot.recipientColumns.filter(
    (column) => column !== "certificate_type",
  );
  assert.throws(
    () => assertReusableCredentialLegacyBaseline(snapshot),
    /does not match the expected pre-reusable-Credential baseline/,
  );
});

test("rejects adoption after reusable Credential tables already exist", () => {
  const snapshot = legacySnapshot();
  snapshot.reusableTables = ["certificate_credentials"];
  assert.throws(
    () => assertReusableCredentialLegacyBaseline(snapshot),
    /does not match the expected pre-reusable-Credential baseline/,
  );
});
