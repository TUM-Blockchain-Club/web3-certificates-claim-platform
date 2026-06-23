import { Mail } from "lucide-react";
import { EmailRequestForm } from "@/app/_components/email-request-form";

export default function Home() {
  return (
    <main className="page">
      <section className="claim-grid">
        <div className="intro-panel">
          <div>
            <p className="kicker">Cohort 1</p>
            <h1>Claim your Web3 Certificate.</h1>
            <p className="lead">
              Receive a secure link, download the certificate, and record your
              TBC NFT destination.
            </p>
          </div>
          <div className="meta-strip">
            <div className="meta-line">
              <span className="meta-label">Certificate</span>
              <span className="meta-value">Web3 Talents Certificate</span>
            </div>
            <div className="meta-line">
              <span className="meta-label">Issuer</span>
              <span className="meta-value">Tum Blockchain Club</span>
            </div>
          </div>
        </div>
        <div className="form-panel">
          <div className="stack">
            <Mail aria-hidden="true" size={34} strokeWidth={1.8} />
            <h2>Email access</h2>
            <EmailRequestForm />
          </div>
        </div>
      </section>
    </main>
  );
}
