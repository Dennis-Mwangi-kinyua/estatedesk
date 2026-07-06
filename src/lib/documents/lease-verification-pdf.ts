import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export type VerifiedLeasePdfData = {
  serialNumber: string;
  verificationUrl: string;
  issuedAt: Date;
  organizationName: string;
  organizationAddress?: string | null;
  tenantName: string;
  tenantId: string;
  tenantPhone: string;
  tenantEmail?: string | null;
  tenantNationalIdMasked?: string | null;
  tenantStatus: string;
  tenantBelongsToOrg: boolean;
  propertyName: string;
  buildingName?: string | null;
  unitName: string;
  leaseId: string;
  leaseStatus: string;
  startDate: Date;
  endDate?: Date | null;
  monthlyRent: number;
  deposit?: number | null;
  dueDay: number;
  currencyCode: string;
  sourceContractHash: string;
  contractFileName: string;
};

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function wrapText(value: string, maxChars: number) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

export async function generateVerifiedLeasePdf(
  contractBytes: Uint8Array,
  data: VerifiedLeasePdfData,
) {
  const pdf = await PDFDocument.load(contractBytes);
  pdf.setTitle(`Lease ${data.serialNumber}`);
  pdf.setAuthor(data.organizationName);
  pdf.setSubject("Verified tenancy lease");
  pdf.setCreator("EstateDesk Document Trust");
  pdf.setProducer("EstateDesk Document Trust");
  pdf.setCreationDate(data.issuedAt);
  pdf.setModificationDate(data.issuedAt);

  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const qrImage = await pdf.embedPng(
    await QRCode.toBuffer(data.verificationUrl, {
      type: "png",
      width: 280,
      margin: 1,
      errorCorrectionLevel: "M",
    }),
  );

  const ink = rgb(0.07, 0.09, 0.13);
  const muted = rgb(0.38, 0.41, 0.47);
  const green = rgb(0.02, 0.45, 0.28);
  const line = rgb(0.88, 0.89, 0.91);
  const x = 46;

  page.drawRectangle({ x: 0, y: 754, width: 595.28, height: 87.89, color: ink });
  page.drawText("ESTATEDESK LEASE VERIFICATION", {
    x: 46,
    y: 806,
    size: 16,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(data.serialNumber, {
    x: 390,
    y: 806,
    size: 9,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(data.organizationName, {
    x: 46,
    y: 783,
    size: 10,
    font: regular,
    color: rgb(0.75, 0.78, 0.82),
  });

  page.drawText("TENANT REGISTRATION", { x, y: 720, size: 8, font: bold, color: muted });
  page.drawText(data.tenantName, { x, y: 700, size: 18, font: bold, color: ink });
  page.drawText(
    data.tenantBelongsToOrg
      ? "Registered tenant confirmed for this organisation"
      : "Tenant registration could not be confirmed",
    {
      x,
      y: 678,
      size: 8,
      font: bold,
      color: data.tenantBelongsToOrg ? green : rgb(0.7, 0.2, 0.2),
    },
  );

  const location = [data.propertyName, data.buildingName, `Unit ${data.unitName}`]
    .filter(Boolean)
    .join(" / ");

  const details = [
    ["Tenant ID", data.tenantId],
    ["Tenant phone", data.tenantPhone],
    ["Tenant email", data.tenantEmail || "Not supplied"],
    ["National ID", data.tenantNationalIdMasked || "Not supplied"],
    ["Tenant status", label(data.tenantStatus)],
    ["Property / unit", location],
    ["Lease ID", data.leaseId],
    ["Lease status", label(data.leaseStatus)],
    ["Lease start", formatDate(data.startDate)],
    ["Lease end", data.endDate ? formatDate(data.endDate) : "Open-ended"],
    ["Monthly rent", formatMoney(data.monthlyRent, data.currencyCode)],
    [
      "Deposit",
      data.deposit == null
        ? "Not recorded"
        : formatMoney(data.deposit, data.currencyCode),
    ],
    ["Rent due day", `Day ${data.dueDay}`],
    ["Contract file", data.contractFileName],
  ];

  let y = 640;
  for (let index = 0; index < details.length; index += 2) {
    for (let column = 0; column < 2; column += 1) {
      const item = details[index + column];
      if (!item) continue;

      const columnX = x + column * 270;
      page.drawText(item[0], {
        x: columnX,
        y,
        size: 7.5,
        font: regular,
        color: muted,
      });

      wrapText(item[1], 38)
        .slice(0, 2)
        .forEach((text, lineIndex) => {
          page.drawText(text, {
            x: columnX,
            y: y - 13 - lineIndex * 11,
            size: 9,
            font: bold,
            color: ink,
          });
        });
    }

    y -= 52;
  }

  page.drawRectangle({ x, y: 60, width: 503, height: 130, borderColor: line, borderWidth: 1 });
  page.drawImage(qrImage, { x: 62, y: 76, width: 98, height: 98 });
  page.drawText("VERIFY THIS LEASE", { x: 180, y: 158, size: 10, font: bold, color: ink });
  page.drawText(
    "Scan to confirm the serial number, tenant registration, property, unit and lease terms.",
    { x: 180, y: 139, size: 7.5, font: regular, color: muted, maxWidth: 330, lineHeight: 11 },
  );
  page.drawText(`Issued: ${formatDate(data.issuedAt)}`, {
    x: 180,
    y: 117,
    size: 8,
    font: regular,
    color: ink,
  });
  page.drawText(`Serial: ${data.serialNumber}`, {
    x: 180,
    y: 99,
    size: 8,
    font: bold,
    color: ink,
  });
  page.drawText(`Contract SHA-256: ${data.sourceContractHash}`, {
    x: 180,
    y: 80,
    size: 6.5,
    font: regular,
    color: muted,
    maxWidth: 330,
    lineHeight: 9,
  });
  page.drawText(
    "EstateDesk document trust • This certificate is appended to the registered lease contract.",
    { x, y: 31, size: 7, font: regular, color: muted },
  );

  return pdf.save({ useObjectStreams: false });
}