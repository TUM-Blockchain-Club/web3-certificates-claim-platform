import { Download, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { NftPreferenceForm } from "@/app/_components/nft-preference-form";
import { getCredentialPreferences, getRecipientById } from "@/lib/recipients";
import { verifyMagicLinkToken } from "@/lib/magic-link";

type PageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ClaimPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const payload = token ? verifyMagicLinkToken(token) : null;

  if (!payload) {
    notFound();
  }

  const recipient = await getRecipientById(payload.recipientId);
  if (!recipient) {
    notFound();
  }

  const preferences = await getCredentialPreferences(
    recipient.credentials.map((credential) => credential.id),
  );

  return (
    <main className="page">
      <section className="claim-card">
        <div className="stack">
          <ShieldCheck aria-hidden="true" size={34} strokeWidth={1.8} />
          <h1 className="claim-name">{recipient.participantName}</h1>
          <p className="lead">
            Your certificate credentials are ready. Each PDF contains its
            permanent public verification URL.
          </p>
        </div>

        {recipient.credentials.map((credential) => (
          <section className="credential-block" key={credential.id}>
            <p className="kicker">{credential.cohort}</p>
            <dl className="certificate-summary">
              <div className="summary-row">
                <dt className="summary-label">Certificate</dt>
                <dd className="summary-value">{credential.certificateName}</dd>
              </div>
              <div className="summary-row">
                <dt className="summary-label">Role</dt>
                <dd className="summary-value">{credential.certificateType}</dd>
              </div>
              <div className="summary-row">
                <dt className="summary-label">Issued</dt>
                <dd className="summary-value">{credential.issuedOn}</dd>
              </div>
              <div className="summary-row">
                <dt className="summary-label">ID</dt>
                <dd className="summary-value">{credential.certificateId}</dd>
              </div>
            </dl>

            <div className="actions">
              <a
                className="button"
                href={`/api/certificates/${encodeURIComponent(
                  credential.certificateId,
                )}/pdf?token=${encodeURIComponent(token ?? "")}`}
              >
                <Download aria-hidden="true" size={18} />
                Download PDF
              </a>
              <a
                className="button secondary"
                href={credential.verificationUrl}
                target="_blank"
                rel="noreferrer"
              >
                Verify
              </a>
            </div>

            <NftPreferenceForm
              credentialId={credential.id}
              token={token ?? ""}
              existingPreference={preferences.get(credential.id) ?? null}
            />
          </section>
        ))}
      </section>
    </main>
  );
}
