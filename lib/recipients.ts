import type { JSONValue } from "postgres";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

type ClaimRow = {
  certificate_id: string;
  certificate_issued_on: string | Date;
  certificate_name: string;
  certificate_type: CertificateType;
  cohort: string;
  credential_row_id: string;
  email: string;
  participant_name: string;
  public_display_name: string;
  recipient_id: string;
};

type PreferenceRow = {
  credential_id: string;
  destination_type: "evm_wallet" | "tbc_wallet" | "none";
  evm_address: string | null;
};

export type CertificateType = "participant" | "mentor";

export type CertificateCredential = {
  certificateId: string;
  certificateName: string;
  certificateType: CertificateType;
  cohort: string;
  id: string;
  issuedOn: string;
  issuedOnIso: string;
  participantName: string;
  publicDisplayName: string;
  recipientId: string;
  verificationUrl: string;
};

export type CertificateRecipient = {
  credentials: CertificateCredential[];
  email: string;
  id: string;
  participantName: string;
};

export type NftPreference = {
  destinationType: "evm_wallet" | "tbc_wallet" | "none";
  evmAddress: string | null;
};

const CLAIM_SELECT = [
  "recipient_id",
  "credential_row_id",
  "certificate_id",
  "certificate_type",
  "cohort",
  "certificate_name",
  "participant_name",
  "public_display_name",
  "email",
  "certificate_issued_on",
].join(", ");

function formatDate(value: string | Date) {
  const isoDate = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  return {
    formatted: dateFormatter.format(new Date(`${isoDate}T00:00:00Z`)),
    isoDate,
  };
}

function mapCredential(row: ClaimRow): CertificateCredential {
  const issued = formatDate(row.certificate_issued_on);

  return {
    certificateId: row.certificate_id,
    certificateName: row.certificate_name,
    certificateType: row.certificate_type,
    cohort: row.cohort,
    id: row.credential_row_id,
    issuedOn: issued.formatted,
    issuedOnIso: issued.isoDate,
    participantName: row.participant_name,
    publicDisplayName: row.public_display_name,
    recipientId: row.recipient_id,
    verificationUrl: new URL(
      `/verify/${encodeURIComponent(row.certificate_id)}`,
      env.CERTIFICATES_BASE_URL,
    ).toString(),
  };
}

function mapRecipient(rows: ClaimRow[]): CertificateRecipient | null {
  const first = rows[0];
  if (!first) {
    return null;
  }

  return {
    credentials: rows.map(mapCredential),
    email: first.email,
    id: first.recipient_id,
    participantName: first.participant_name,
  };
}

async function getClaimRows(column: "email" | "recipient_id", value: string) {
  const { data, error } = await supabaseAdmin
    .from("certificate_claim_records")
    .select(CLAIM_SELECT)
    .eq(column, value)
    .order("certificate_issued_on", { ascending: true })
    .returns<ClaimRow[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getRecipientByEmail(email: string) {
  return mapRecipient(await getClaimRows("email", email.trim().toLowerCase()));
}

export async function getRecipientById(id: string) {
  return mapRecipient(await getClaimRows("recipient_id", id));
}

export async function getCredentialByCertificateId(certificateId: string) {
  const { data: row, error } = await supabaseAdmin
    .from("certificate_claim_records")
    .select(CLAIM_SELECT)
    .eq("certificate_id", certificateId)
    .maybeSingle<ClaimRow>();

  if (error) {
    throw error;
  }

  return row ? mapCredential(row) : null;
}

export async function getCredentialById(id: string) {
  const { data: row, error } = await supabaseAdmin
    .from("certificate_claim_records")
    .select(CLAIM_SELECT)
    .eq("credential_row_id", id)
    .maybeSingle<ClaimRow>();

  if (error) {
    throw error;
  }

  return row ? mapCredential(row) : null;
}

export async function getCredentialPreferences(credentialIds: string[]) {
  if (credentialIds.length === 0) {
    return new Map<string, NftPreference>();
  }

  const { data: rows, error } = await supabaseAdmin
    .from("certificate_nft_preferences")
    .select("credential_id, destination_type, evm_address")
    .in("credential_id", credentialIds)
    .returns<PreferenceRow[]>();

  if (error) {
    throw error;
  }

  return new Map(
    (rows ?? []).map((row) => [
      row.credential_id,
      {
        destinationType: row.destination_type,
        evmAddress: row.evm_address,
      },
    ]),
  );
}

export async function savePreference(input: {
  credentialId: string;
  destinationType: "evm_wallet" | "tbc_wallet" | "none";
  evmAddress: string | null;
}) {
  const { error } = await supabaseAdmin
    .from("certificate_nft_preferences")
    .upsert(
      {
        credential_id: input.credentialId,
        destination_type: input.destinationType,
        evm_address: input.evmAddress,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "credential_id",
      },
    );

  if (error) {
    throw error;
  }
}

export async function writeAuditEvent(
  credentialId: string | null,
  eventType: string,
  metadata: JSONValue = {},
) {
  const { error } = await supabaseAdmin.from("certificate_audit_events").insert({
    credential_id: credentialId,
    event_type: eventType,
    metadata,
  });

  if (error) {
    throw error;
  }
}
