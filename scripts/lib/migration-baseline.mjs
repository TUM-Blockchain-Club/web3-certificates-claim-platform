const EXPECTED_VERIFICATION_COLUMNS = [
  "certificate_id",
  "cohort",
  "certificate_name",
  "participant_name",
  "certificate_issued_on",
  "certificate_type",
];

export function assertReusableCredentialLegacyBaseline(snapshot) {
  const recipientColumns = new Set(snapshot.recipientColumns);
  const verificationColumns = snapshot.verificationColumns.join(",");
  const expectedVerificationColumns = EXPECTED_VERIFICATION_COLUMNS.join(",");
  const valid =
    recipientColumns.has("certificate_id") &&
    recipientColumns.has("participant_name") &&
    recipientColumns.has("certificate_type") &&
    !recipientColumns.has("public_display_name") &&
    verificationColumns === expectedVerificationColumns &&
    snapshot.legacyWeb3Tables.length === 0 &&
    snapshot.reusableTables.length === 0;

  if (!valid) {
    throw new Error(
      "Database does not match the expected pre-reusable-Credential baseline; refusing migration adoption.",
    );
  }
}
