import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CertificateRecipient } from "@/lib/recipients";

const PUBLIC_DIR = join(/*turbopackIgnore: true*/ process.cwd(), "public");
const FONT_PATHS = {
  sans: join(PUBLIC_DIR, "certificate-assets/fonts/DejaVuSans.ttf"),
  sansBold: join(PUBLIC_DIR, "certificate-assets/fonts/DejaVuSans-Bold.ttf"),
  serif: join(PUBLIC_DIR, "certificate-assets/fonts/DejaVuSerif.ttf"),
  serifBold: join(PUBLIC_DIR, "certificate-assets/fonts/DejaVuSerif-Bold.ttf"),
};
const IMAGE_PATHS = {
  tbcLogo: join(PUBLIC_DIR, "tbc-wordmark.png"),
};
const TEMPLATE_PATHS = {
  certificate: join(
    PUBLIC_DIR,
    "certificate-assets/templates/web3-talents-certificate-template.pdf",
  ),
};

function centerText(page: ReturnType<PDFDocument["getPage"]>, text: string, options: {
  color?: ReturnType<typeof rgb>;
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  maxWidth?: number;
  size: number;
  width: number;
  y: number;
}) {
  const size = options.maxWidth
    ? Math.min(
        options.size,
        (options.maxWidth / options.font.widthOfTextAtSize(text, options.size)) *
          options.size,
      )
    : options.size;
  const width = options.font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    color: options.color ?? rgb(0.09, 0.09, 0.09),
    font: options.font,
    size,
    x: (options.width - width) / 2,
    y: options.y,
  });
}

function rightText(page: ReturnType<PDFDocument["getPage"]>, text: string, options: {
  color?: ReturnType<typeof rgb>;
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  rightX: number;
  size: number;
  y: number;
}) {
  const width = options.font.widthOfTextAtSize(text, options.size);
  page.drawText(text, {
    color: options.color,
    font: options.font,
    size: options.size,
    x: options.rightX - width,
    y: options.y,
  });
}

export async function renderCertificatePdf(
  recipient: CertificateRecipient,
) {
  const templateBytes = await readFile(/*turbopackIgnore: true*/ TEMPLATE_PATHS.certificate);
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  const [
    sansFontBytes,
    sansBoldFontBytes,
    serifFontBytes,
    serifBoldFontBytes,
    tbcLogoBytes,
  ] = await Promise.all([
    readFile(/*turbopackIgnore: true*/ FONT_PATHS.sans),
    readFile(/*turbopackIgnore: true*/ FONT_PATHS.sansBold),
    readFile(/*turbopackIgnore: true*/ FONT_PATHS.serif),
    readFile(/*turbopackIgnore: true*/ FONT_PATHS.serifBold),
    readFile(/*turbopackIgnore: true*/ IMAGE_PATHS.tbcLogo),
  ]);

  const sans = await pdfDoc.embedFont(sansFontBytes);
  const sansBold = await pdfDoc.embedFont(sansBoldFontBytes);
  const serif = await pdfDoc.embedFont(serifFontBytes);
  const serifBold = await pdfDoc.embedFont(serifBoldFontBytes);
  const tbcLogo = await pdfDoc.embedPng(tbcLogoBytes);
  const qrCodeDataUrl = await QRCode.toDataURL(recipient.verificationUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 7,
  });
  const qrCode = await pdfDoc.embedPng(
    Buffer.from(qrCodeDataUrl.split(",")[1] ?? "", "base64"),
  );

  const page = pdfDoc.getPage(0);
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const foreground = rgb(1, 1, 1);
  const muted = rgb(0.753, 0.733, 0.839);
  const mutedStrong = rgb(0.906, 0.847, 1);
  const accent = rgb(0.404, 0.18, 0.702);
  const accentLight = rgb(0.761, 0.624, 1);
  const logoTile = rgb(0.992, 0.988, 1);

  const tbcLogoWidth = 500;
  const tbcLogoHeight = tbcLogoWidth * (tbcLogo.height / tbcLogo.width);
  page.drawImage(tbcLogo, {
    height: tbcLogoHeight,
    width: tbcLogoWidth,
    x: pageWidth - 670,
    y: pageHeight - 520,
  });

  centerText(page, recipient.certificateName, {
    color: accentLight,
    font: sansBold,
    size: 100,
    width: pageWidth,
    y: 2340,
  });

  centerText(page, "awarded to", {
    color: muted,
    font: sans,
    size: 116,
    width: pageWidth,
    y: 2075,
  });

  centerText(page, recipient.participantName, {
    color: foreground,
    font: serifBold,
    maxWidth: pageWidth - 1050,
    size: Math.min(330, Math.max(190, 4200 / Math.max(recipient.participantName.length, 12))),
    width: pageWidth,
    y: 1665,
  });

  centerText(page, "for successfully completing Web3 Talents", {
    color: foreground,
    font: serif,
    size: 150,
    width: pageWidth,
    y: 1390,
  });

  centerText(page, recipient.cohort, {
    color: accentLight,
    font: sansBold,
    size: 112,
    width: pageWidth,
    y: 1185,
  });

  page.drawRectangle({
    color: accent,
    height: 8,
    width: 560,
    x: (pageWidth - 560) / 2,
    y: 1062,
  });

  page.drawText(`Issued ${recipient.issuedOn}`, {
    color: muted,
    font: sans,
    size: 64,
    x: 330,
    y: 610,
  });

  page.drawText("Issued by Tum Blockchain Club", {
    color: muted,
    font: sans,
    size: 58,
    x: 330,
    y: 475,
  });

  page.drawText(`Certificate ID: ${recipient.certificateId}`, {
    color: muted,
    font: sans,
    size: 45,
    x: 330,
    y: 355,
  });

  const qrSize = 440;
  const qrX = pageWidth - 760;
  const qrY = 405;
  page.drawRectangle({
    color: logoTile,
    height: qrSize + 54,
    width: qrSize + 54,
    x: qrX - 27,
    y: qrY - 27,
  });
  page.drawImage(qrCode, {
    height: qrSize,
    width: qrSize,
    x: qrX,
    y: qrY,
  });

  const scanLabel = "Scan to verify";
  const scanLabelSize = 62;
  page.drawText(scanLabel, {
    color: accentLight,
    font: sansBold,
    size: scanLabelSize,
    x: qrX + (qrSize - sansBold.widthOfTextAtSize(scanLabel, scanLabelSize)) / 2,
    y: qrY + qrSize + 105,
  });

  const verificationText = recipient.verificationUrl.replace("https://", "");
  rightText(page, verificationText, {
    color: mutedStrong,
    font: sans,
    rightX: qrX + qrSize,
    size: 36,
    y: 275,
  });

  pdfDoc.setTitle(`${recipient.certificateName} - ${recipient.participantName}`);
  pdfDoc.setAuthor("Tum Blockchain Club");
  pdfDoc.setSubject("Web3 Talents Certificate");
  pdfDoc.setKeywords(["Web3 Talents", "Tum Blockchain Club", "Certificate"]);
  pdfDoc.setCreationDate(new Date(`${recipient.issuedOnIso}T00:00:00Z`));
  pdfDoc.setModificationDate(new Date());

  return pdfDoc.save();
}
