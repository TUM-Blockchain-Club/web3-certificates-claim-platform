import { notFound } from "next/navigation";
import { renderCertificatePdf } from "@/lib/certificate-pdf";
import { verifyMagicLinkToken } from "@/lib/magic-link";
import { getRecipientByCertificateId } from "@/lib/recipients";

type RouteContext = {
  params: Promise<{
    certificateId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { certificateId } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const payload = token ? verifyMagicLinkToken(token) : null;

  if (!payload) {
    notFound();
  }

  const recipient = await getRecipientByCertificateId(certificateId);

  if (!recipient || recipient.id !== payload.recipientId) {
    notFound();
  }

  const origin = new URL(request.url).origin;
  const pdfBytes = await renderCertificatePdf(recipient, origin);
  const pdfBody = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(pdfBody).set(pdfBytes);
  const filename = `web3-talents-certificate-${recipient.certificateId}.pdf`;

  return new Response(pdfBody, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/pdf",
    },
  });
}
