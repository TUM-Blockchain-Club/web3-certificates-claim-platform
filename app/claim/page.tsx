import { Download, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { NftPreferenceForm } from "@/app/_components/nft-preference-form";
import { getRecipientById, getRecipientPreference } from "@/lib/recipients";
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

  const [recipient, preference] = await Promise.all([
    getRecipientById(payload.recipientId),
    getRecipientPreference(payload.recipientId),
  ]);

  if (!recipient) {
    notFound();
  }

  return (
    <main className="page">
      <section className="claim-card">
        <div className="stack">
          <ShieldCheck aria-hidden="true" size={34} strokeWidth={1.8} />
          <p className="kicker">{recipient.cohort}</p>
          <h1 className="claim-name">{recipient.participantName}</h1>
          <p className="lead">
            Your certificate is ready. The verification URL is embedded in the
            PDF and remains public under the certificates subdomain.
          </p>
        </div>

        <dl className="certificate-summary">
          <div className="summary-row">
            <dt className="summary-label">Certificate</dt>
            <dd className="summary-value">{recipient.certificateName}</dd>
          </div>
          <div className="summary-row">
            <dt className="summary-label">Issued</dt>
            <dd className="summary-value">{recipient.issuedOn}</dd>
          </div>
          <div className="summary-row">
            <dt className="summary-label">ID</dt>
            <dd className="summary-value">{recipient.certificateId}</dd>
          </div>
        </dl>

        <div className="actions">
          <a
            className="button"
            href={`/api/certificates/${encodeURIComponent(
              recipient.certificateId,
            )}/pdf?token=${encodeURIComponent(token ?? "")}`}
          >
            <Download aria-hidden="true" size={18} />
            Download PDF
          </a>
          <a
            className="button secondary"
            href={`${recipient.verificationUrl}`}
            target="_blank"
            rel="noreferrer"
          >
            Verify
          </a>
        </div>

        <NftPreferenceForm
          token={token ?? ""}
          existingPreference={preference}
        />
      </section>
    </main>
  );
}
