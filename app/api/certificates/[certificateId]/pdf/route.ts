import { notFound } from "next/navigation";
import { renderCertificatePdf } from "@/lib/certificate-pdf";
import { verifyMagicLinkToken } from "@/lib/magic-link";
import { getCredentialByCertificateId } from "@/lib/recipients";

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

  const credential = await getCredentialByCertificateId(certificateId);

  if (!credential || credential.recipientId !== payload.recipientId) {
    notFound();
  }

  const pdfBytes = await renderCertificatePdf(credential);
  const pdfBody = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(pdfBody).set(pdfBytes);
  const filename = `web3-talents-certificate-${credential.certificateId}.pdf`;

  return new Response(pdfBody, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/pdf",
    },
  });
}
