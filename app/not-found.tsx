import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <section className="claim-card">
        <p className="kicker">Unavailable</p>
        <h1>Claim link unavailable.</h1>
        <p className="lead">
          The link may be expired or malformed. Request a new one from the email
          page.
        </p>
        <div className="actions">
          <Link className="button" href="/">
            Request Link
          </Link>
        </div>
      </section>
    </main>
  );
}

