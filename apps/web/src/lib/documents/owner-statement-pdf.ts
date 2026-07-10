import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type OwnerStatementPdfData = {
  organizationName: string;
  organizationAddress?: string | null;
  landlordName: string;
  landlordEmail?: string | null;
  from: Date;
  to: Date;
  currencyCode: string;
  generatedAt: Date;
  properties: Array<{
    propertyName: string;
    income: number;
    expenses: number;
    distributions: number;
    netToOwner: number;
  }>;
  totals: {
    income: number;
    expenses: number;
    distributions: number;
    netToOwner: number;
  };
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
    timeZone: "UTC",
  }).format(value);
}

export async function generateOwnerStatementPdf(data: OwnerStatementPdfData) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Owner statement – ${data.landlordName}`);
  pdf.setAuthor("EstateDesk");
  pdf.setSubject("Owner statement");
  pdf.setCreator("EstateDesk Accounting");
  pdf.setProducer("EstateDesk Accounting");
  pdf.setCreationDate(data.generatedAt);
  pdf.setModificationDate(data.generatedAt);

  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const ink = rgb(0.07, 0.09, 0.13);
  const muted = rgb(0.38, 0.41, 0.47);
  const accent = rgb(0.02, 0.45, 0.28);
  const line = rgb(0.88, 0.89, 0.91);
  const x = 48;
  let y = 790;

  page.drawRectangle({ x: 0, y: 770, width: 595.28, height: 71.89, color: ink });
  page.drawText("EstateDesk", { x, y: 805, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText("OWNER STATEMENT", {
    x,
    y: 784,
    size: 9,
    font: regular,
    color: rgb(0.75, 0.78, 0.82),
  });

  y = 735;
  page.drawText(data.organizationName, { x, y, size: 16, font: bold, color: ink });
  y -= 18;
  if (data.organizationAddress) {
    page.drawText(data.organizationAddress.slice(0, 80), { x, y, size: 9, font: regular, color: muted });
    y -= 14;
  }

  y -= 8;
  page.drawText("Prepared for", { x, y, size: 9, font: bold, color: muted });
  y -= 16;
  page.drawText(data.landlordName, { x, y, size: 14, font: bold, color: ink });
  y -= 14;
  if (data.landlordEmail) {
    page.drawText(data.landlordEmail, { x, y, size: 9, font: regular, color: muted });
    y -= 14;
  }

  y -= 6;
  page.drawText(`Period: ${formatDate(data.from)} – ${formatDate(data.to)}`, {
    x,
    y,
    size: 10,
    font: regular,
    color: ink,
  });
  y -= 14;
  page.drawText(`Generated: ${formatDate(data.generatedAt)}`, {
    x,
    y,
    size: 9,
    font: regular,
    color: muted,
  });

  y -= 28;
  page.drawText("Net to owner", { x, y, size: 9, font: bold, color: muted });
  y -= 24;
  page.drawText(formatMoney(data.totals.netToOwner, data.currencyCode), {
    x,
    y,
    size: 24,
    font: bold,
    color: accent,
  });

  y -= 36;
  const columns = [
    { label: "Property", width: 170, align: "left" as const },
    { label: "Income", width: 90, align: "right" as const },
    { label: "Expenses", width: 90, align: "right" as const },
    { label: "Distributions", width: 95, align: "right" as const },
    { label: "Net", width: 90, align: "right" as const },
  ];

  let colX = x;
  for (const column of columns) {
    page.drawText(column.label, {
      x: column.align === "right" ? colX : colX,
      y,
      size: 8,
      font: bold,
      color: muted,
    });
    colX += column.width;
  }

  y -= 8;
  page.drawLine({ start: { x, y }, end: { x: 547, y }, thickness: 1, color: line });
  y -= 16;

  const rows = [...data.properties];
  if (rows.length === 0) {
    page.drawText("No posted GL activity for this period.", {
      x,
      y,
      size: 10,
      font: regular,
      color: muted,
    });
  }

  for (const row of rows) {
    if (y < 120) break;
    const values = [
      row.propertyName.slice(0, 28),
      formatMoney(row.income, data.currencyCode),
      formatMoney(row.expenses, data.currencyCode),
      formatMoney(row.distributions, data.currencyCode),
      formatMoney(row.netToOwner, data.currencyCode),
    ];
    colX = x;
    values.forEach((value, index) => {
      const column = columns[index]!;
      const textWidth = regular.widthOfTextAtSize(value, 9);
      const drawX =
        column.align === "right" ? colX + column.width - textWidth - 4 : colX;
      page.drawText(value, {
        x: drawX,
        y,
        size: 9,
        font: regular,
        color: ink,
      });
      colX += column.width;
    });
    y -= 16;
  }

  y -= 8;
  page.drawLine({ start: { x, y }, end: { x: 547, y }, thickness: 1, color: line });
  y -= 18;
  colX = x;
  const totalValues = [
    "Total",
    formatMoney(data.totals.income, data.currencyCode),
    formatMoney(data.totals.expenses, data.currencyCode),
    formatMoney(data.totals.distributions, data.currencyCode),
    formatMoney(data.totals.netToOwner, data.currencyCode),
  ];
  totalValues.forEach((value, index) => {
    const column = columns[index]!;
    const font = bold;
    const textWidth = font.widthOfTextAtSize(value, 9);
    const drawX = column.align === "right" ? colX + column.width - textWidth - 4 : colX;
    page.drawText(value, { x: drawX, y, size: 9, font, color: ink });
    colX += column.width;
  });

  page.drawText("This statement summarizes posted income, expenses, and distributions by property.", {
    x,
    y: 52,
    size: 8,
    font: regular,
    color: muted,
  });

  return pdf.save();
}