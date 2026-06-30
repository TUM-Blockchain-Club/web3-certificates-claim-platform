import type { JSONValue } from "postgres";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

type RecipientRow = {
  certificate_id: string;
  certificate_issued_on: string | Date;
  certificate_name: string;
  certificate_type: CertificateType;
  cohort: string;
  email: string;
  id: string;
  participant_name: string;
};

type PreferenceRow = {
  destination_type: "evm_wallet" | "tbc_wallet" | "none";
  evm_address: string | null;
};

export type CertificateRecipient = {
  certificateId: string;
  certificateName: string;
  certificateType: CertificateType;
  cohort: string;
  email: string;
  id: string;
  issuedOn: string;
  issuedOnIso: string;
  participantName: string;
  verificationUrl: string;
};

export type CertificateType = "participant" | "mentor";

export type NftPreference = {
  destinationType: "evm_wallet" | "tbc_wallet" | "none";
  evmAddress: string | null;
};

const RECIPIENT_SELECT =
  "id, certificate_id, certificate_type, cohort, certificate_name, participant_name, email, certificate_issued_on";

function formatDate(value: string | Date) {
  const isoDate = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  return {
    formatted: dateFormatter.format(new Date(`${isoDate}T00:00:00Z`)),
    isoDate,
  };
}

function mapRecipient(row: RecipientRow): CertificateRecipient {
  const issued = formatDate(row.certificate_issued_on);
  const verificationUrl = new URL(
    `/verify/${encodeURIComponent(row.certificate_id)}`,
    env.CERTIFICATES_BASE_URL,
  );

  return {
    certificateId: row.certificate_id,
    certificateName: row.certificate_name,
    certificateType: row.certificate_type,
    cohort: row.cohort,
    email: row.email,
    id: row.id,
    issuedOn: issued.formatted,
    issuedOnIso: issued.isoDate,
    participantName: row.participant_name,
    verificationUrl: verificationUrl.toString(),
  };
}

export async function getRecipientByEmail(email: string) {
  const { data: row, error } = await supabaseAdmin
    .from("certificate_recipients")
    .select(RECIPIENT_SELECT)
    .eq("email_normalized", email.trim().toLowerCase())
    .eq("verification_active", true)
    .maybeSingle<RecipientRow>();

  if (error) {
    throw error;
  }

  return row ? mapRecipient(row) : null;
}

export async function getRecipientById(id: string) {
  const { data: row, error } = await supabaseAdmin
    .from("certificate_recipients")
    .select(RECIPIENT_SELECT)
    .eq("id", id)
    .eq("verification_active", true)
    .maybeSingle<RecipientRow>();

  if (error) {
    throw error;
  }

  return row ? mapRecipient(row) : null;
}

export async function getRecipientByCertificateId(certificateId: string) {
  const { data: row, error } = await supabaseAdmin
    .from("certificate_recipients")
    .select(RECIPIENT_SELECT)
    .eq("certificate_id", certificateId)
    .eq("verification_active", true)
    .maybeSingle<RecipientRow>();

  if (error) {
    throw error;
  }

  return row ? mapRecipient(row) : null;
}

export async function getRecipientPreference(recipientId: string): Promise<NftPreference | null> {
  const { data: row, error } = await supabaseAdmin
    .from("certificate_nft_preferences")
    .select("destination_type, evm_address")
    .eq("recipient_id", recipientId)
    .maybeSingle<PreferenceRow>();

  if (error) {
    throw error;
  }

  return row
    ? {
        destinationType: row.destination_type,
        evmAddress: row.evm_address,
      }
    : null;
}

export async function savePreference(input: {
  destinationType: "evm_wallet" | "tbc_wallet" | "none";
  evmAddress: string | null;
  recipientId: string;
}) {
  const { error } = await supabaseAdmin
    .from("certificate_nft_preferences")
    .upsert(
      {
        destination_type: input.destinationType,
        evm_address: input.evmAddress,
        recipient_id: input.recipientId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "recipient_id",
      },
    );

  if (error) {
    throw error;
  }
}

export async function writeAuditEvent(
  recipientId: string | null,
  eventType: string,
  metadata: JSONValue = {},
) {
  const { error } = await supabaseAdmin.from("certificate_audit_events").insert({
    event_type: eventType,
    metadata,
    recipient_id: recipientId,
  });

  if (error) {
    throw error;
  }
}
