import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export type ReceiptPdfData = {
  serialNumber: string;
  verificationUrl: string;
  status: string;
  issuedAt: Date;
  organizationName: string;
  organizationAddress?: string | null;
  payerName: string;
  amount: number;
  currencyCode: string;
  paymentMethod: string;
  paymentFor: string;
  paymentReference?: string | null;
  paidAt: Date;
};

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Nairobi",
  }).format(value);
}

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateReceiptPdf(data: ReceiptPdfData) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Receipt ${data.serialNumber}`);
  pdf.setAuthor("EstateDesk");
  pdf.setSubject("Verified payment receipt");
  pdf.setCreator("EstateDesk Document Trust");
  pdf.setProducer("EstateDesk Document Trust");
  pdf.setCreationDate(data.issuedAt);
  pdf.setModificationDate(data.issuedAt);

  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const qrBuffer = await QRCode.toBuffer(data.verificationUrl, {
    type: "png",
    width: 280,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#111827", light: "#FFFFFF" },
  });
  const qrImage = await pdf.embedPng(qrBuffer);

  const ink = rgb(0.07, 0.09, 0.13);
  const muted = rgb(0.38, 0.41, 0.47);
  const green = rgb(0.02, 0.45, 0.28);
  const line = rgb(0.88, 0.89, 0.91);
  const x = 52;

  page.drawRectangle({ x: 0, y: 770, width: 595.28, height: 71.89, color: ink });
  page.drawText("EstateDesk", { x, y: 805, size: 19, font: bold, color: rgb(1, 1, 1) });
  page.drawText("VERIFIED PAYMENT RECEIPT", {
    x,
    y: 784,
    size: 9,
    font: regular,
    color: rgb(0.75, 0.78, 0.82),
  });

  page.drawText(data.organizationName, { x, y: 730, size: 18, font: bold, color: ink });
  if (data.organizationAddress) {
    page.drawText(data.organizationAddress.slice(0, 75), {
      x,
      y: 711,
      size: 9,
      font: regular,
      color: muted,
    });
  }

  page.drawText("AMOUNT RECEIVED", { x, y: 660, size: 9, font: bold, color: muted });
  page.drawText(formatMoney(data.amount, data.currencyCode), {
    x,
    y: 622,
    size: 28,
    font: bold,
    color: green,
  });
  page.drawText(`Status: ${label(data.status)}`, {
    x,
    y: 597,
    size: 10,
    font: bold,
    color: green,
  });

  const rows = [
    ["Received from", data.payerName],
    ["Payment for", label(data.paymentFor)],
    ["Payment method", label(data.paymentMethod)],
    ["Payment reference", data.paymentReference || "Not supplied"],
    ["Paid at", formatDate(data.paidAt)],
    ["Issued at", formatDate(data.issuedAt)],
  ];

  let rowY = 545;
  for (const [rowLabel, value] of rows) {
    page.drawLine({ start: { x, y: rowY - 10 }, end: { x: 543, y: rowY - 10 }, thickness: 0.7, color: line });
    page.drawText(rowLabel, { x, y: rowY + 6, size: 9, font: regular, color: muted });
    page.drawText(value.slice(0, 72), { x: 205, y: rowY + 6, size: 10, font: bold, color: ink });
    rowY -= 48;
  }

  page.drawRectangle({ x, y: 105, width: 491, height: 130, borderColor: line, borderWidth: 1 });
  page.drawImage(qrImage, { x: 68, y: 122, width: 96, height: 96 });
  page.drawText("VERIFY THIS RECEIPT", { x: 184, y: 195, size: 10, font: bold, color: ink });
  page.drawText("Scan the QR code to confirm its current status and origin.", {
    x: 184,
    y: 174,
    size: 9,
    font: regular,
    color: muted,
  });
  page.drawText(`Serial: ${data.serialNumber}`, { x: 184, y: 150, size: 9, font: bold, color: ink });
  page.drawText(data.verificationUrl.slice(0, 66), { x: 184, y: 130, size: 7, font: regular, color: muted });

  page.drawText("This receipt records a payment verified in EstateDesk. Confirm material payments against the source provider statement.", {
    x,
    y: 65,
    size: 7.5,
    font: regular,
    color: muted,
  });

  return pdf.save({ useObjectStreams: false, addDefaultPage: false });
}
