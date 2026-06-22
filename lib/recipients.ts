import type { JSONValue } from "postgres";
import { env } from "@/lib/env";
import { sql } from "@/lib/db";

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
  cohort: string;
  email: string;
  id: string;
  issuedOn: string;
  issuedOnIso: string;
  participantName: string;
  verificationUrl: string;
};

export type NftPreference = {
  destinationType: "evm_wallet" | "tbc_wallet" | "none";
  evmAddress: string | null;
};

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
  const [row] = await sql<RecipientRow[]>`
    select
      id,
      certificate_id,
      cohort,
      certificate_name,
      participant_name,
      email,
      certificate_issued_on
    from public.certificate_recipients
    where email_normalized = ${email.trim().toLowerCase()}
      and verification_active = true
    limit 1
  `;

  return row ? mapRecipient(row) : null;
}

export async function getRecipientById(id: string) {
  const [row] = await sql<RecipientRow[]>`
    select
      id,
      certificate_id,
      cohort,
      certificate_name,
      participant_name,
      email,
      certificate_issued_on
    from public.certificate_recipients
    where id = ${id}
      and verification_active = true
    limit 1
  `;

  return row ? mapRecipient(row) : null;
}

export async function getRecipientByCertificateId(certificateId: string) {
  const [row] = await sql<RecipientRow[]>`
    select
      id,
      certificate_id,
      cohort,
      certificate_name,
      participant_name,
      email,
      certificate_issued_on
    from public.certificate_recipients
    where certificate_id = ${certificateId}
      and verification_active = true
    limit 1
  `;

  return row ? mapRecipient(row) : null;
}

export async function getRecipientPreference(recipientId: string): Promise<NftPreference | null> {
  const [row] = await sql<PreferenceRow[]>`
    select destination_type, evm_address
    from public.certificate_nft_preferences
    where recipient_id = ${recipientId}
    limit 1
  `;

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
  await sql`
    insert into public.certificate_nft_preferences (
      recipient_id,
      destination_type,
      evm_address
    )
    values (
      ${input.recipientId},
      ${input.destinationType},
      ${input.evmAddress}
    )
    on conflict (recipient_id)
    do update set
      destination_type = excluded.destination_type,
      evm_address = excluded.evm_address,
      updated_at = now()
  `;
}

export async function writeAuditEvent(
  recipientId: string | null,
  eventType: string,
  metadata: JSONValue = {},
) {
  await sql`
    insert into public.certificate_audit_events (
      recipient_id,
      event_type,
      metadata
    )
    values (
      ${recipientId},
      ${eventType},
      ${sql.json(metadata)}
    )
  `;
}
