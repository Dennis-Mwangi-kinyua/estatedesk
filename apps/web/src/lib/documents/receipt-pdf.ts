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
  organizationPhone?: string | null;
  organizationEmail?: string | null;
  kraPin?: string | null;
  /** Tenant / buyer KRA PIN for eTIMS-shaped receipts */
  tenantKraPin?: string | null;
  /** Control unit serial when org has eTIMS device registered */
  etimsControlUnitSerial?: string | null;
  /** Footer line from buildEtimsReadyReceiptFields */
  etimsFooter?: string | null;
  tenantIdentifier?: string | null;
  propertyName?: string | null;
  unitName?: string | null;
  leaseIdentifier?: string | null;
  periods?: string[];
  allocations?: Array<{ period: string; description: string; amount: number }>;
  previousBalance?: number | null;
  remainingBalance?: number | null;
  verifiedBy?: string | null;
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

async function generateLegacyReceiptPdf(data: ReceiptPdfData) {
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
  page.drawText("EstateDesk Receipt", {
    x,
    y: 784,
    size: 10,
    font: bold,
    color: rgb(1, 1, 1),
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

const SMALL_NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS_WORDS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function integerWords(value: number): string {
  if (value < 20) return SMALL_NUMBER_WORDS[value];
  if (value < 100) return `${TENS_WORDS[Math.floor(value / 10)]}${value % 10 ? `-${SMALL_NUMBER_WORDS[value % 10]}` : ""}`;
  if (value < 1_000) return `${SMALL_NUMBER_WORDS[Math.floor(value / 100)]} hundred${value % 100 ? ` ${integerWords(value % 100)}` : ""}`;
  for (const [size, name] of [[1_000_000_000, "billion"], [1_000_000, "million"], [1_000, "thousand"]] as const) {
    if (value >= size) return `${integerWords(Math.floor(value / size))} ${name}${value % size ? ` ${integerWords(value % size)}` : ""}`;
  }
  return String(value);
}

function amountInWords(amount: number, currencyCode: string) {
  const whole = Math.floor(Math.abs(amount));
  const cents = Math.round((Math.abs(amount) - whole) * 100);
  return `${currencyCode} ${integerWords(whole)}${cents ? ` and ${integerWords(cents)} cents` : " only"}`;
}

function wrapText(text: string, maxChars: number) {
  const words = text.trim().split(/\s+/).flatMap((word) => {
    if (word.length <= maxChars) return [word];
    return Array.from({ length: Math.ceil(word.length / maxChars) }, (_, index) =>
      word.slice(index * maxChars, (index + 1) * maxChars),
    );
  });
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= maxChars) line += ` ${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

async function generateEnhancedReceiptPdf(data: ReceiptPdfData) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Receipt ${data.serialNumber}`);
  pdf.setAuthor(data.organizationName);
  pdf.setSubject("Verified payment receipt");
  pdf.setCreator("EstateDesk Document Trust");
  pdf.setProducer("EstateDesk Document Trust");
  pdf.setCreationDate(data.issuedAt);
  pdf.setModificationDate(data.issuedAt);
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const qrImage = await pdf.embedPng(await QRCode.toBuffer(data.verificationUrl, { type: "png", width: 280, margin: 1, errorCorrectionLevel: "M" }));
  const ink = rgb(0.07, 0.09, 0.13), muted = rgb(0.38, 0.41, 0.47), green = rgb(0.02, 0.45, 0.28), line = rgb(0.88, 0.89, 0.91);
  const x = 46;

  page.drawRectangle({ x: 0, y: 754, width: 595.28, height: 87.89, color: ink });
  page.drawCircle({ x: 72, y: 798, size: 25, color: green });
  const initials = data.organizationName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "ED";
  page.drawText(initials, { x: 61, y: 791, size: 15, font: bold, color: rgb(1, 1, 1) });
  page.drawText(data.organizationName, { x: 110, y: 806, size: 17, font: bold, color: rgb(1, 1, 1) });
  page.drawText("EstateDesk Receipt", { x: 110, y: 783, size: 10, font: bold, color: rgb(1, 1, 1) });
  page.drawText(data.serialNumber, { x: 390, y: 783, size: 8, font: bold, color: rgb(1, 1, 1) });

  const issuer = [data.organizationAddress, data.organizationPhone, data.organizationEmail, data.kraPin ? `KRA PIN: ${data.kraPin}` : null].filter(Boolean).join("  |  ");
  wrapText(issuer || "Issuer contact details not supplied", 100).slice(0, 2).forEach((text, i) => page.drawText(text, { x, y: 729 - i * 12, size: 8, font: regular, color: muted }));
  page.drawText("AMOUNT RECEIVED", { x, y: 681, size: 8, font: bold, color: muted });
  page.drawText(formatMoney(data.amount, data.currencyCode), { x, y: 650, size: 25, font: bold, color: green });
  page.drawText(amountInWords(data.amount, data.currencyCode), { x, y: 630, size: 8, font: regular, color: muted });
  page.drawText(`STATUS: ${label(data.status)}`, { x: 447, y: 659, size: 9, font: bold, color: green });

  const details = [
    ["Received from", data.payerName], ["Tenant ID", data.tenantIdentifier || "Not supplied"],
    ["Property / unit", [data.propertyName, data.unitName].filter(Boolean).join(" / ") || "Not linked"],
    ["Lease ID", data.leaseIdentifier || "Not linked"], ["Payment for", label(data.paymentFor)],
    ["Payment method", label(data.paymentMethod)], ["Reference", data.paymentReference || "Not supplied"],
    ["Period(s)", data.periods?.join(", ") || "Not specified"], ["Paid at", formatDate(data.paidAt)],
    ["Verified by", data.verifiedBy || "EstateDesk authorized staff"],
  ];
  let y = 594;
  for (let index = 0; index < details.length; index += 2) {
    for (let column = 0; column < 2; column++) {
      const item = details[index + column]; if (!item) continue;
      const cx = x + column * 270;
      page.drawText(item[0], { x: cx, y, size: 7.5, font: regular, color: muted });
      const valueLines = wrapText(item[1], 38).slice(0, 2);
      valueLines.forEach((text, i) => page.drawText(text, { x: cx, y: y - 13 - i * 11, size: 9, font: bold, color: ink }));
    }
    y -= 52;
  }

  page.drawText("PAYMENT ALLOCATION", { x, y: 326, size: 8, font: bold, color: muted });
  page.drawLine({ start: { x, y: 316 }, end: { x: 549, y: 316 }, thickness: 1, color: line });
  const allocations = data.allocations?.length ? data.allocations : [{ period: data.periods?.[0] ?? "—", description: label(data.paymentFor), amount: data.amount }];
  allocations.slice(0, 3).forEach((allocation, i) => {
    const ay = 296 - i * 23;
    page.drawText(allocation.period, { x, y: ay, size: 8, font: regular, color: ink });
    page.drawText(wrapText(label(allocation.description), 42)[0] ?? "Payment", { x: 150, y: ay, size: 8, font: regular, color: ink });
    page.drawText(formatMoney(allocation.amount, data.currencyCode), { x: 430, y: ay, size: 8, font: bold, color: ink });
  });
  const balanceY = 218;
  page.drawText(`Previous balance: ${data.previousBalance == null ? "Not applicable" : formatMoney(data.previousBalance, data.currencyCode)}`, { x, y: balanceY, size: 8, font: regular, color: muted });
  page.drawText(`Remaining balance: ${data.remainingBalance == null ? "Not applicable" : formatMoney(data.remainingBalance, data.currencyCode)}`, { x: 310, y: balanceY, size: 8, font: bold, color: ink });

  page.drawRectangle({ x, y: 60, width: 503, height: 130, borderColor: line, borderWidth: 1 });
  page.drawImage(qrImage, { x: 62, y: 76, width: 98, height: 98 });
  page.drawText("VERIFY THIS RECEIPT", { x: 180, y: 158, size: 10, font: bold, color: ink });
  page.drawText("Scan to compare the issuer, payer, amount, reference, property and payment period.", { x: 180, y: 139, size: 7.5, font: regular, color: muted });
  page.drawText(`Issued: ${formatDate(data.issuedAt)}`, { x: 180, y: 117, size: 8, font: regular, color: ink });
  page.drawText(`Processed by: ${data.verifiedBy || "EstateDesk authorized staff"}`, { x: 180, y: 99, size: 8, font: regular, color: ink });
  page.drawText("Digitally issued; no handwritten signature is required.", { x: 180, y: 80, size: 7.5, font: regular, color: muted });
  const etimsLine =
    data.etimsFooter ||
    [
      data.kraPin ? `Seller PIN: ${data.kraPin}` : null,
      data.etimsControlUnitSerial
        ? `CU: ${data.etimsControlUnitSerial}`
        : "CU: pending",
      "eTIMS layout-ready",
    ]
      .filter(Boolean)
      .join(" · ");
  page.drawText(etimsLine.slice(0, 110), {
    x,
    y: 42,
    size: 7,
    font: regular,
    color: muted,
  });
  page.drawText(
    "EstateDesk document trust • Confirm material payments against the source provider statement.",
    { x, y: 28, size: 7, font: regular, color: muted },
  );
  return pdf.save({ useObjectStreams: false, addDefaultPage: false });
}

export async function generateReceiptPdf(data: ReceiptPdfData) {
  return data.periods !== undefined
    ? generateEnhancedReceiptPdf(data)
    : generateLegacyReceiptPdf(data);
}
