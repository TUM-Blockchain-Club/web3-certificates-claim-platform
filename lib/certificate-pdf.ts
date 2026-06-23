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
  const background = rgb(0.012, 0, 0.043);
  const panel = rgb(0.102, 0.075, 0.161);
  const panelStrong = rgb(0.118, 0.082, 0.192);
  const foreground = rgb(1, 1, 1);
  const muted = rgb(0.753, 0.733, 0.839);
  const mutedStrong = rgb(0.906, 0.847, 1);
  const accent = rgb(0.404, 0.18, 0.702);
  const accentLight = rgb(0.761, 0.624, 1);
  const logoTile = rgb(0.992, 0.988, 1);

  page.drawRectangle({
    color: background,
    height: PAGE_HEIGHT,
    width: PAGE_WIDTH,
    x: 0,
    y: 0,
  });

  page.drawRectangle({
    color: panel,
    height: PAGE_HEIGHT - MARGIN * 2,
    width: PAGE_WIDTH - MARGIN * 2,
    x: MARGIN,
    y: MARGIN,
  });

  page.drawRectangle({
    borderColor: accent,
    borderWidth: 2.2,
    height: PAGE_HEIGHT - MARGIN * 2 - 18,
    width: PAGE_WIDTH - MARGIN * 2 - 18,
    x: MARGIN + 9,
    y: MARGIN + 9,
  });

  page.drawRectangle({
    color: panelStrong,
    height: 102,
    width: PAGE_WIDTH - MARGIN * 2 - 36,
    x: MARGIN + 18,
    y: PAGE_HEIGHT - MARGIN - 120,
  });

  const web3LogoWidth = 174;
  const web3LogoHeight = web3LogoWidth * (web3Logo.height / web3Logo.width);
  page.drawRectangle({
    color: logoTile,
    height: web3LogoHeight + 22,
    width: web3LogoWidth + 28,
    x: MARGIN + 28,
    y: PAGE_HEIGHT - MARGIN - 68,
  });
  page.drawImage(web3Logo, {
    height: web3LogoHeight,
    width: web3LogoWidth,
    x: MARGIN + 42,
    y: PAGE_HEIGHT - MARGIN - 57,
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
    color: accentLight,
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
    color: foreground,
    font: serifBold,
    size: Math.min(54, Math.max(32, 720 / Math.max(recipient.participantName.length, 12))),
    y: 326,
  });

  centerText(page, "for successfully completing Web3 Talents", {
    color: foreground,
    font: serif,
    size: 22,
    y: 282,
  });

  centerText(page, recipient.cohort, {
    color: accentLight,
    font: sansBold,
    size: 16,
    y: 248,
  });

  page.drawRectangle({
    color: accent,
    height: 2,
    width: 180,
    x: (PAGE_WIDTH - 180) / 2,
    y: 228,
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
  const qrX = PAGE_WIDTH - MARGIN - 36 - qrSize;
  const qrY = MARGIN + 34;
  page.drawRectangle({
    color: logoTile,
    height: qrSize + 14,
    width: qrSize + 14,
    x: qrX - 7,
    y: qrY - 7,
  });
  page.drawImage(qrCode, {
    height: qrSize,
    width: qrSize,
    x: qrX,
    y: qrY,
  });

  page.drawText("Verify", {
    color: accentLight,
    font: sansBold,
    size: 10,
    x: qrX,
    y: MARGIN + 22,
  });

  const verificationText = recipient.verificationUrl.replace("https://", "");
  const verificationTextWidth = sans.widthOfTextAtSize(verificationText, 8);
  page.drawText(verificationText, {
    color: mutedStrong,
    font: sans,
    size: 8,
    x: Math.max(MARGIN + 36, qrX - 24 - verificationTextWidth),
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
