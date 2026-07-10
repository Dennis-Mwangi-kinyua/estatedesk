import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import QRCode from "qrcode";

export type InvoicePdfWaterReading = {
  prevReading: number;
  currentReading: number;
  unitsUsed: number;
  ratePerUnit: number;
  fixedCharge: number;
  billStatus: string;
  readingStatus: string;
  submittedByName?: string | null;
  confirmedByName?: string | null;
};

export type InvoicePdfPreviousBill = {
  period: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  rentTotal: number | null;
  waterTotal: number | null;
  status: string;
};

export type InvoicePdfLine = {
  label: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  waterReading?: InvoicePdfWaterReading;
};

export type InvoicePdfData = {
  serialNumber: string;
  verificationCode: string;
  verificationUrl: string;
  status: string;
  issuedAt: Date;
  dueDate: Date;
  period: string;
  organizationName: string;
  organizationAddress?: string | null;
  organizationPhone?: string | null;
  organizationEmail?: string | null;
  tenantName: string;
  tenantIdentifier?: string | null;
  propertyName: string;
  unitName: string;
  buildingName?: string | null;
  currencyCode: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  lines: InvoicePdfLine[];
  submittedByName?: string | null;
  confirmedByName?: string | null;
  confirmedAt?: Date | null;
  previousBill?: InvoicePdfPreviousBill | null;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

type PdfColor = ReturnType<typeof rgb>;

const COLORS = {
  ink: rgb(0.09, 0.11, 0.15),
  muted: rgb(0.42, 0.45, 0.5),
  accent: rgb(0.06, 0.45, 0.36),
  accentInk: rgb(0.05, 0.34, 0.28),
  line: rgb(0.86, 0.89, 0.91),
  white: rgb(1, 1, 1),
  amber: rgb(0.76, 0.48, 0.08),
  slate: rgb(0.24, 0.35, 0.55),
  headerBg: rgb(0.94, 0.98, 0.97),
  headerStripe: rgb(0.1, 0.52, 0.43),
  tableHead: rgb(0.9, 0.95, 0.93),
  tableZebra: rgb(0.98, 0.995, 0.99),
  summaryRow: rgb(0.95, 0.99, 0.97),
  totalsRow: rgb(0.93, 0.98, 0.96),
  waterHead: rgb(0.93, 0.96, 1),
  waterRow: rgb(0.97, 0.99, 1),
  waterAccent: rgb(0.2, 0.45, 0.72),
};

type Fonts = { regular: PDFFont; bold: PDFFont };

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
    timeZone: "Africa/Nairobi",
  }).format(value);
}

function formatDateTime(value: Date) {
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

function wrapText(text: string, maxChars: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= maxChars) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitText(text: string, maxChars: number) {
  const lines = wrapText(text, maxChars);
  return lines[0] ?? "";
}

function statusColor(status: string) {
  if (status === "PAID") return COLORS.accent;
  if (status === "PARTIAL") return COLORS.amber;
  return COLORS.slate;
}

function drawRect(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = COLORS.white,
  border = true,
) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: fill,
    borderColor: border ? COLORS.line : fill,
    borderWidth: border ? 0.75 : 0,
  });
}

function drawSectionLabel(
  page: PDFPage,
  fonts: Fonts,
  x: number,
  y: number,
  title: string,
  accent: PdfColor,
) {
  page.drawRectangle({
    x,
    y: y - 8,
    width: 3,
    height: 10,
    color: accent,
  });
  page.drawText(title.toUpperCase(), {
    x: x + 8,
    y,
    size: 7.5,
    font: fonts.bold,
    color: COLORS.accentInk,
  });
}

function drawCellText(
  page: PDFPage,
  fonts: Fonts,
  text: string,
  x: number,
  y: number,
  width: number,
  options?: { bold?: boolean; size?: number; color?: PdfColor; align?: "left" | "right" },
) {
  const size = options?.size ?? 8;
  const font = options?.bold ? fonts.bold : fonts.regular;
  const color = options?.color ?? COLORS.ink;
  const maxChars = Math.max(8, Math.floor(width / (size * 0.52)));
  const value = fitText(text, maxChars);
  const textWidth = font.widthOfTextAtSize(value, size);
  const drawX =
    options?.align === "right" ? x + width - textWidth - 4 : x + 4;

  page.drawText(value, { x: drawX, y, size, font, color });
}

type TableTheme = {
  accent: PdfColor;
  headerFill: PdfColor;
  zebraFill: PdfColor;
  dataFill?: PdfColor;
};

type TableRowStyle = {
  fill?: PdfColor;
  bold?: boolean;
  valueColor?: PdfColor;
  valueColumns?: number[];
};

function drawTable(
  page: PDFPage,
  fonts: Fonts,
  topY: number,
  title: string | null,
  columns: Array<{ label: string; width: number; align?: "left" | "right" }>,
  rows: string[][],
  options?: {
    headerHeight?: number;
    rowHeight?: number;
    theme?: TableTheme;
    rowStyles?: Record<number, TableRowStyle>;
  },
) {
  const headerHeight = options?.headerHeight ?? 18;
  const rowHeight = options?.rowHeight ?? 17;
  const titleHeight = title ? 16 : 0;
  const tableHeight = titleHeight + headerHeight + rows.length * rowHeight;
  const bottomY = topY - tableHeight;
  const theme = options?.theme ?? {
    accent: COLORS.headerStripe,
    headerFill: COLORS.tableHead,
    zebraFill: COLORS.tableZebra,
  };

  drawRect(page, MARGIN, bottomY, CONTENT_WIDTH, tableHeight);

  let y = topY;
  if (title) {
    y -= 12;
    drawSectionLabel(page, fonts, MARGIN + 4, y, title, theme.accent);
    y -= titleHeight - 12;
  }

  drawRect(page, MARGIN, y - headerHeight, CONTENT_WIDTH, headerHeight, theme.headerFill);
  let colX = MARGIN;
  columns.forEach((column) => {
    drawCellText(page, fonts, column.label, colX, y - 12, column.width, {
      bold: true,
      size: 7.5,
      color: COLORS.accentInk,
      align: column.align,
    });
    colX += column.width;
  });

  y -= headerHeight;
  rows.forEach((row, rowIndex) => {
    const rowStyle = options?.rowStyles?.[rowIndex];
    const rowFill =
      rowStyle?.fill ??
      (theme.dataFill && rowIndex === 0
        ? theme.dataFill
        : rowIndex % 2 === 1
          ? theme.zebraFill
          : null);

    if (rowFill) {
      drawRect(
        page,
        MARGIN + 0.5,
        y - rowHeight + 1,
        CONTENT_WIDTH - 1,
        rowHeight,
        rowFill,
        false,
      );
    }

    colX = MARGIN;
    row.forEach((value, columnIndex) => {
      const column = columns[columnIndex];
      if (!column) return;
      const emphasizeValue = rowStyle?.valueColumns?.includes(columnIndex);
      drawCellText(page, fonts, value, colX, y - 12, column.width, {
        bold: rowStyle?.bold || columnIndex === 0 || emphasizeValue,
        align: column.align,
        color: emphasizeValue ? rowStyle?.valueColor ?? COLORS.accent : COLORS.ink,
      });
      colX += column.width;
    });
    y -= rowHeight;
  });

  return bottomY - 8;
}

function drawKeyValueTable(
  page: PDFPage,
  fonts: Fonts,
  topY: number,
  title: string,
  pairs: Array<{ label: string; value: string }>,
) {
  const rows: string[][] = [];
  for (let index = 0; index < pairs.length; index += 2) {
    const left = pairs[index];
    const right = pairs[index + 1];
    rows.push([
      left.label,
      left.value,
      right?.label ?? "",
      right?.value ?? "",
    ]);
  }

  return drawTable(
    page,
    fonts,
    topY,
    title,
    [
      { label: "Field", width: 108 },
      { label: "Value", width: 149 },
      { label: "Field", width: 108 },
      { label: "Value", width: 150 },
    ],
    rows,
    { rowHeight: 16 },
  );
}

function drawDocumentHeader(
  page: PDFPage,
  fonts: Fonts,
  qrImage: Awaited<ReturnType<PDFDocument["embedPng"]>>,
  data: InvoicePdfData,
) {
  const headerHeight = 78;
  const topY = PAGE_HEIGHT - MARGIN;
  const bottomY = topY - headerHeight;

  drawRect(page, MARGIN, bottomY, CONTENT_WIDTH, headerHeight, COLORS.headerBg);
  page.drawRectangle({
    x: MARGIN,
    y: bottomY,
    width: 4,
    height: headerHeight,
    color: COLORS.headerStripe,
  });

  const qrSize = 58;
  drawRect(page, MARGIN + 10, bottomY + 9, qrSize + 2, qrSize + 2, COLORS.white);
  page.drawImage(qrImage, {
    x: MARGIN + 11,
    y: bottomY + 10,
    width: qrSize,
    height: qrSize,
  });

  const textX = MARGIN + 78;
  page.drawText("EstateDesk Invoice", {
    x: textX,
    y: topY - 24,
    size: 16,
    font: fonts.bold,
    color: COLORS.accentInk,
  });
  page.drawText(`Serial  ${data.serialNumber}`, {
    x: textX,
    y: topY - 38,
    size: 8,
    font: fonts.bold,
    color: COLORS.ink,
  });
  page.drawText(`Code  ${fitText(data.verificationCode, 42)}`, {
    x: textX,
    y: topY - 50,
    size: 7.5,
    font: fonts.regular,
    color: COLORS.muted,
  });
  page.drawText(fitText(data.organizationName, 48), {
    x: textX,
    y: topY - 62,
    size: 9,
    font: fonts.bold,
    color: COLORS.ink,
  });

  const badge = data.status;
  const badgeWidth = Math.max(54, badge.length * 5.5);
  const badgeX = PAGE_WIDTH - MARGIN - badgeWidth - 8;
  page.drawRectangle({
    x: badgeX,
    y: topY - 30,
    width: badgeWidth,
    height: 16,
    color: statusColor(badge),
  });
  page.drawText(badge, {
    x: badgeX + 7,
    y: topY - 26,
    size: 7.5,
    font: fonts.bold,
    color: COLORS.white,
  });
  page.drawText("Scan QR to verify", {
    x: badgeX - 4,
    y: topY - 48,
    size: 7,
    font: fonts.regular,
    color: COLORS.accent,
  });

  return bottomY - 10;
}

export async function generateInvoicePdf(data: InvoicePdfData) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`EstateDesk Invoice ${data.serialNumber}`);
  pdf.setAuthor(data.organizationName);
  pdf.setSubject(`Tenant invoice for ${data.period}`);
  pdf.setCreator("EstateDesk Document Trust");
  pdf.setProducer("EstateDesk Document Trust");
  pdf.setCreationDate(data.issuedAt);
  pdf.setModificationDate(data.issuedAt);

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  const qrImage = await pdf.embedPng(
    await QRCode.toBuffer(data.verificationUrl, {
      type: "png",
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111827", light: "#FFFFFF" },
    }),
  );

  const propertyUnit = [data.propertyName, data.unitName, data.buildingName]
    .filter(Boolean)
    .join(" · ");
  const orgContact =
    [data.organizationPhone, data.organizationEmail].filter(Boolean).join(" · ") ||
    "Not supplied";

  let y = drawDocumentHeader(page, fonts, qrImage, data);

  y = drawTable(
    page,
    fonts,
    y,
    "Invoice summary",
    [
      { label: "Billing period", width: 80 },
      { label: "Due date", width: 80 },
      { label: "Issued at", width: 100 },
      { label: "Amount due", width: 85 },
      { label: "Amount paid", width: 85 },
      { label: "Balance", width: 85 },
    ],
    [
      [
        data.period,
        formatDate(data.dueDate),
        formatDateTime(data.issuedAt),
        formatMoney(data.amountDue, data.currencyCode),
        formatMoney(data.amountPaid, data.currencyCode),
        formatMoney(data.balance, data.currencyCode),
      ],
    ],
    {
      headerHeight: 16,
      rowHeight: 18,
      theme: {
        accent: COLORS.headerStripe,
        headerFill: COLORS.tableHead,
        zebraFill: COLORS.tableZebra,
        dataFill: COLORS.summaryRow,
      },
    },
  );

  y = drawTable(
    page,
    fonts,
    y,
    "Parties",
    [
      { label: "Bill from", width: 257 },
      { label: "Bill to", width: 258 },
    ],
    [
      [
        fitText(
          `${data.organizationName} · ${orgContact}${data.organizationAddress ? ` · ${data.organizationAddress}` : ""}`,
          72,
        ),
        fitText(
          `${data.tenantName}${data.tenantIdentifier ? ` · Ref ${data.tenantIdentifier}` : ""} · ${propertyUnit}`,
          72,
        ),
      ],
    ],
    { rowHeight: 20 },
  );

  y = drawKeyValueTable(page, fonts, y, "Invoice details", [
    { label: "Organisation", value: data.organizationName },
    { label: "Tenant", value: data.tenantName },
    { label: "Tenant reference", value: data.tenantIdentifier ?? "—" },
    { label: "Property / unit", value: propertyUnit },
    { label: "Reading submitted by", value: data.submittedByName ?? "Not recorded" },
    {
      label: "Bill confirmed by",
      value: data.confirmedByName ?? "Awaiting confirmation",
    },
    {
      label: "Confirmed at",
      value: data.confirmedAt ? formatDateTime(data.confirmedAt) : "Pending",
    },
    { label: "Document status", value: data.status },
  ]);

  if (data.previousBill) {
    const previous = data.previousBill;
    y = drawTable(
      page,
      fonts,
      y,
      `Previous billing period · ${previous.period}`,
      [
        { label: "Total billed", width: 86 },
        { label: "Paid", width: 86 },
        { label: "Balance", width: 86 },
        { label: "Rent", width: 86 },
        { label: "Water", width: 85 },
        { label: "Status", width: 86 },
      ],
      [
        [
          formatMoney(previous.amountDue, data.currencyCode),
          formatMoney(previous.amountPaid, data.currencyCode),
          formatMoney(previous.balance, data.currencyCode),
          previous.rentTotal != null
            ? formatMoney(previous.rentTotal, data.currencyCode)
            : "—",
          previous.waterTotal != null
            ? formatMoney(previous.waterTotal, data.currencyCode)
            : "—",
          previous.status,
        ],
      ],
      { headerHeight: 16, rowHeight: 17 },
    );
  }

  const chargeRows = data.lines.map((line, index) => [
    String(index + 1),
    line.label,
    formatMoney(line.amountDue, data.currencyCode),
    formatMoney(line.amountPaid, data.currencyCode),
    formatMoney(line.balance, data.currencyCode),
  ]);

  const subtotalRowIndex = chargeRows.length;
  const paidRowIndex = chargeRows.length + 1;
  const balanceRowIndex = chargeRows.length + 2;

  chargeRows.push(
    ["", "Subtotal", formatMoney(data.amountDue, data.currencyCode), "", ""],
    ["", "Amount paid", "", formatMoney(data.amountPaid, data.currencyCode), ""],
    [
      "",
      "Balance due",
      "",
      "",
      formatMoney(data.balance, data.currencyCode),
    ],
  );

  y = drawTable(
    page,
    fonts,
    y,
    "Charges",
    [
      { label: "#", width: 28 },
      { label: "Description", width: 176 },
      { label: "Amount", width: 92, align: "right" },
      { label: "Paid", width: 92, align: "right" },
      { label: "Balance", width: 127, align: "right" },
    ],
    chargeRows,
    {
      rowHeight: 16,
      theme: {
        accent: COLORS.headerStripe,
        headerFill: COLORS.tableHead,
        zebraFill: COLORS.tableZebra,
      },
      rowStyles: {
        [subtotalRowIndex]: { fill: COLORS.totalsRow },
        [paidRowIndex]: { fill: COLORS.totalsRow },
        [balanceRowIndex]: {
          fill: COLORS.summaryRow,
          bold: true,
          valueColumns: [4],
          valueColor: COLORS.accent,
        },
      },
    },
  );

  const waterLine = data.lines.find((line) => line.waterReading);
  if (waterLine?.waterReading) {
    const reading = waterLine.waterReading;
    y = drawTable(
      page,
      fonts,
      y,
      "Water meter reading",
      [
        { label: "Previous", width: 52 },
        { label: "Current", width: 52 },
        { label: "Units", width: 44 },
        { label: "Rate / unit", width: 68 },
        { label: "Fixed", width: 58 },
        { label: "Reading", width: 68 },
        { label: "Bill", width: 68 },
        { label: "Submitted by", width: 105 },
      ],
      [
        [
          String(reading.prevReading),
          String(reading.currentReading),
          String(reading.unitsUsed),
          formatMoney(reading.ratePerUnit, data.currencyCode),
          formatMoney(reading.fixedCharge, data.currencyCode),
          fitText(reading.readingStatus, 14),
          fitText(reading.billStatus, 14),
          reading.submittedByName ?? "Not recorded",
        ],
        [
          "Confirmed by",
          reading.confirmedByName ?? "Awaiting confirmation",
          "",
          "",
          "",
          "",
          "",
          "",
        ],
      ],
      {
        headerHeight: 16,
        rowHeight: 16,
        theme: {
          accent: COLORS.waterAccent,
          headerFill: COLORS.waterHead,
          zebraFill: COLORS.waterRow,
        },
      },
    );
  }

  page.drawLine({
    start: { x: MARGIN, y: 52 },
    end: { x: PAGE_WIDTH - MARGIN, y: 52 },
    thickness: 0.75,
    color: COLORS.line,
  });

  const disclaimer =
    "System-generated invoice issued by EstateDesk on behalf of the organisation above. " +
    "Digitally issued — no handwritten signature required.";

  wrapText(disclaimer, 108).forEach((line, index) => {
    page.drawText(line, {
      x: MARGIN,
      y: 34 - index * 9,
      size: 6.5,
      font: fonts.regular,
      color: COLORS.muted,
    });
  });
  page.drawText("EstateDesk Document Trust", {
    x: PAGE_WIDTH - MARGIN - 98,
    y: 22,
    size: 6.5,
    font: fonts.bold,
    color: COLORS.accentInk,
  });

  return pdf.save({ useObjectStreams: false, addDefaultPage: false });
}