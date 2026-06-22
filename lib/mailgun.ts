import { env } from "@/lib/env";

type SendClaimLinkEmailInput = {
  certificateName: string;
  claimUrl: string;
  participantName: string;
  to: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendClaimLinkEmail({
  certificateName,
  claimUrl,
  participantName,
  to,
}: SendClaimLinkEmailInput) {
  const endpoint = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;
  const from = `${env.MAILGUN_FROM_NAME} <${env.MAILGUN_FROM_EMAIL}>`;
  const subject = "Claim your Web3 Talents certificate";
  const plainText = [
    `Hi ${participantName},`,
    "",
    `Your ${certificateName} is ready.`,
    "",
    `Claim link: ${claimUrl}`,
    "",
    "This link is valid for one hour.",
    "",
    "Web3Talents",
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.55; color: #161616;">
      <p>Hi ${escapeHtml(participantName)},</p>
      <p>Your ${escapeHtml(certificateName)} is ready.</p>
      <p>
        <a href="${escapeHtml(claimUrl)}" style="background:#161616;color:#ffffff;display:inline-block;padding:12px 18px;text-decoration:none;font-weight:700;">
          Claim certificate
        </a>
      </p>
      <p>This link is valid for one hour.</p>
      <p>Web3Talents</p>
    </div>
  `;

  const body = new URLSearchParams({
    from,
    html,
    subject,
    text: plainText,
    to,
  });

  const response = await fetch(endpoint, {
    body,
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${env.MAILGUN_API_KEY}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Mailgun request failed: ${response.status} ${message}`);
  }
}

