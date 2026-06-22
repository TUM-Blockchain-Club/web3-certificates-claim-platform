import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CertificateRecipient } from "@/lib/recipients";

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 42;
const PUBLIC_DIR = join(/*turbopackIgnore: true*/ process.cwd(), "public");
const FONT_PATHS = {
  sans: join(PUBLIC_DIR, "certificate-assets/fonts/DejaVuSans.ttf"),
  sansBold: join(PUBLIC_DIR, "certificate-assets/fonts/DejaVuSans-Bold.ttf"),
  serif: join(PUBLIC_DIR, "certificate-assets/fonts/DejaVuSerif.ttf"),
  serifBold: join(PUBLIC_DIR, "certificate-assets/fonts/DejaVuSerif-Bold.ttf"),
};
const IMAGE_PATHS = {
  tbcLogo: join(PUBLIC_DIR, "tbc-wordmark.png"),
  web3Logo: join(PUBLIC_DIR, "web3-talents-logo.png"),
};

function centerText(page: ReturnType<PDFDocument["addPage"]>, text: string, options: {
  color?: ReturnType<typeof rgb>;
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  size: number;
  y: number;
}) {
  const width = options.font.widthOfTextAtSize(text, options.size);
  page.drawText(text, {
    color: options.color ?? rgb(0.09, 0.09, 0.09),
    font: options.font,
    size: options.size,
    x: (PAGE_WIDTH - width) / 2,
    y: options.y,
  });
}

export async function renderCertificatePdf(
  recipient: CertificateRecipient,
) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [
    sansFontBytes,
    sansBoldFontBytes,
    serifFontBytes,
    serifBoldFontBytes,
    web3LogoBytes,
    tbcLogoBytes,
  ] = await Promise.all([
    readFile(/*turbopackIgnore: true*/ FONT_PATHS.sans),
    readFile(/*turbopackIgnore: true*/ FONT_PATHS.sansBold),
    readFile(/*turbopackIgnore: true*/ FONT_PATHS.serif),
    readFile(/*turbopackIgnore: true*/ FONT_PATHS.serifBold),
    readFile(/*turbopackIgnore: true*/ IMAGE_PATHS.web3Logo),
    readFile(/*turbopackIgnore: true*/ IMAGE_PATHS.tbcLogo),
  ]);

  const sans = await pdfDoc.embedFont(sansFontBytes);
  const sansBold = await pdfDoc.embedFont(sansBoldFontBytes);
  const serif = await pdfDoc.embedFont(serifFontBytes);
  const serifBold = await pdfDoc.embedFont(serifBoldFontBytes);
  const web3Logo = await pdfDoc.embedPng(web3LogoBytes);
  const tbcLogo = await pdfDoc.embedPng(tbcLogoBytes);
  const qrCodeDataUrl = await QRCode.toDataURL(recipient.verificationUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 7,
  });
  const qrCode = await pdfDoc.embedPng(
    Buffer.from(qrCodeDataUrl.split(",")[1] ?? "", "base64"),
  );

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const ink = rgb(0.08, 0.08, 0.08);
  const muted = rgb(0.38, 0.36, 0.32);
  const green = rgb(0.05, 0.42, 0.35);
  const brick = rgb(0.66, 0.27, 0.16);
  const paper = rgb(0.98, 0.96, 0.91);
  const line = rgb(0.82, 0.75, 0.65);

  page.drawRectangle({
    color: paper,
    height: PAGE_HEIGHT,
    width: PAGE_WIDTH,
    x: 0,
    y: 0,
  });

  page.drawRectangle({
    borderColor: line,
    borderWidth: 1.2,
    height: PAGE_HEIGHT - MARGIN * 2,
    width: PAGE_WIDTH - MARGIN * 2,
    x: MARGIN,
    y: MARGIN,
  });

  page.drawRectangle({
    borderColor: green,
    borderWidth: 2,
    height: PAGE_HEIGHT - MARGIN * 2 - 18,
    width: PAGE_WIDTH - MARGIN * 2 - 18,
    x: MARGIN + 9,
    y: MARGIN + 9,
  });

  const web3LogoWidth = 174;
  const web3LogoHeight = web3LogoWidth * (web3Logo.height / web3Logo.width);
  page.drawImage(web3Logo, {
    height: web3LogoHeight,
    width: web3LogoWidth,
    x: MARGIN + 34,
    y: PAGE_HEIGHT - MARGIN - 56,
  });

  const tbcLogoWidth = 120;
  const tbcLogoHeight = tbcLogoWidth * (tbcLogo.height / tbcLogo.width);
  page.drawImage(tbcLogo, {
    height: tbcLogoHeight,
    width: tbcLogoWidth,
    x: PAGE_WIDTH - MARGIN - 34 - tbcLogoWidth,
    y: PAGE_HEIGHT - MARGIN - 50,
  });

  centerText(page, recipient.certificateName, {
    color: brick,
    font: sansBold,
    size: 14,
    y: 430,
  });

  centerText(page, "awarded to", {
    color: muted,
    font: sans,
    size: 18,
    y: 388,
  });

  centerText(page, recipient.participantName, {
    color: ink,
    font: serifBold,
    size: Math.min(54, Math.max(32, 720 / Math.max(recipient.participantName.length, 12))),
    y: 326,
  });

  centerText(page, "for successfully completing Web3 Talents", {
    color: ink,
    font: serif,
    size: 22,
    y: 282,
  });

  centerText(page, recipient.cohort, {
    color: green,
    font: sansBold,
    size: 16,
    y: 248,
  });

  page.drawText(`Issued ${recipient.issuedOn}`, {
    color: muted,
    font: sans,
    size: 12,
    x: MARGIN + 36,
    y: MARGIN + 65,
  });

  page.drawText("Issued by Tum Blockchain Club", {
    color: muted,
    font: sans,
    size: 12,
    x: MARGIN + 36,
    y: MARGIN + 43,
  });

  page.drawText(`Certificate ID: ${recipient.certificateId}`, {
    color: muted,
    font: sans,
    size: 10,
    x: MARGIN + 36,
    y: MARGIN + 22,
  });

  const qrSize = 86;
  page.drawImage(qrCode, {
    height: qrSize,
    width: qrSize,
    x: PAGE_WIDTH - MARGIN - 36 - qrSize,
    y: MARGIN + 34,
  });

  page.drawText("Verify", {
    color: green,
    font: sansBold,
    size: 10,
    x: PAGE_WIDTH - MARGIN - 36 - qrSize,
    y: MARGIN + 22,
  });

  const verificationText = recipient.verificationUrl.replace("https://", "");
  page.drawText(verificationText, {
    color: muted,
    font: sans,
    size: 8,
    x: PAGE_WIDTH - MARGIN - 36 - qrSize - 118,
    y: MARGIN + 22,
  });

  pdfDoc.setTitle(`${recipient.certificateName} - ${recipient.participantName}`);
  pdfDoc.setAuthor("Tum Blockchain Club");
  pdfDoc.setSubject("Web3 Talents Certificate");
  pdfDoc.setKeywords(["Web3 Talents", "Tum Blockchain Club", "Certificate"]);
  pdfDoc.setCreationDate(new Date(`${recipient.issuedOnIso}T00:00:00Z`));
  pdfDoc.setModificationDate(new Date());

  return pdfDoc.save();
}
