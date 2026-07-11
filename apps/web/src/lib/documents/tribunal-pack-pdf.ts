import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type TribunalPackCommunication = {
  at: Date | string;
  channel: string;
  direction?: string | null;
  subject?: string | null;
  summary: string;
  actor?: string | null;
};

export type TribunalPackPayment = {
  at: Date | string;
  amount: number;
  method: string;
  status: string;
  reference?: string | null;
  targetType?: string | null;
  period?: string | null;
};

export type TribunalPackCharge = {
  period: string;
  chargeType: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: string;
  dueDate?: Date | string | null;
};

export type TribunalPackData = {
  generatedAt: Date;
  organizationName: string;
  organizationAddress?: string | null;
  tenantName: string;
  tenantPhone?: string | null;
  tenantNationalId?: string | null;
  propertyName: string;
  unitLabel: string;
  leaseStart?: Date | string | null;
  leaseEnd?: Date | string | null;
  monthlyRent?: number | null;
  currencyCode?: string;
  communications: TribunalPackCommunication[];
  payments: TribunalPackPayment[];
  charges: TribunalPackCharge[];
  notes?: string[];
};

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Nairobi",
  }).format(d);
}

function wrap(text: string, max = 95): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/**
 * One-click Rent Restriction Tribunal pack: communications + financial history.
 */
export async function generateTribunalPackPdf(
  data: TribunalPackData,
): Promise<Uint8Array> {
  const currency = data.currencyCode || "KES";
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Tribunal pack — ${data.tenantName}`);
  pdf.setAuthor(data.organizationName);
  pdf.setSubject("Rent Restriction Tribunal evidence bundle");
  pdf.setCreator("EstateDesk Tribunal Pack");
  pdf.setCreationDate(data.generatedAt);
  pdf.setModificationDate(data.generatedAt);

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.07, 0.09, 0.13);
  const muted = rgb(0.38, 0.41, 0.47);
  const line = rgb(0.88, 0.89, 0.91);
  const green = rgb(0.02, 0.45, 0.28);

  let page = pdf.addPage([595.28, 841.89]);
  let y = 800;
  const x = 48;
  const bottom = 56;

  const ensureSpace = (need: number) => {
    if (y - need < bottom) {
      page = pdf.addPage([595.28, 841.89]);
      y = 800;
      page.drawText("EstateDesk Tribunal Pack (continued)", {
        x,
        y,
        size: 9,
        font: bold,
        color: muted,
      });
      y -= 24;
    }
  };

  const drawText = (
    text: string,
    opts?: { size?: number; font?: typeof bold; color?: typeof ink; max?: number },
  ) => {
    const size = opts?.size ?? 9;
    const font = opts?.font ?? regular;
    const color = opts?.color ?? ink;
    for (const part of wrap(text, opts?.max ?? 95)) {
      ensureSpace(size + 6);
      page.drawText(part, { x, y, size, font, color });
      y -= size + 4;
    }
  };

  const section = (title: string) => {
    ensureSpace(28);
    y -= 8;
    page.drawText(title, { x, y, size: 11, font: bold, color: green });
    y -= 6;
    page.drawLine({
      start: { x, y },
      end: { x: 547, y },
      thickness: 1,
      color: line,
    });
    y -= 16;
  };

  page.drawRectangle({ x: 0, y: 770, width: 595.28, height: 72, color: ink });
  page.drawText("EstateDesk", {
    x,
    y: 812,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Rent Restriction Tribunal Pack", {
    x,
    y: 790,
    size: 11,
    font: bold,
    color: rgb(1, 1, 1),
  });
  y = 750;

  drawText(data.organizationName, { size: 14, font: bold });
  if (data.organizationAddress) {
    drawText(data.organizationAddress, { size: 9, color: muted });
  }
  drawText(`Generated: ${formatDate(data.generatedAt)}`, {
    size: 8,
    color: muted,
  });
  drawText(
    "Time-stamped communications and financial history for tribunal filing. Verify against source records before submission.",
    { size: 8, color: muted, max: 90 },
  );

  section("1. Parties & tenancy");
  drawText(`Tenant: ${data.tenantName}`);
  if (data.tenantPhone) drawText(`Phone: ${data.tenantPhone}`);
  if (data.tenantNationalId) drawText(`National ID: ${data.tenantNationalId}`);
  drawText(`Property: ${data.propertyName}`);
  drawText(`Unit: ${data.unitLabel}`);
  drawText(
    `Lease: ${formatDate(data.leaseStart)} → ${formatDate(data.leaseEnd)}`,
  );
  if (data.monthlyRent != null) {
    drawText(`Monthly rent: ${formatMoney(data.monthlyRent, currency)}`);
  }

  section("2. Financial history (charges)");
  if (data.charges.length === 0) {
    drawText("No charge records in selected window.", { color: muted });
  } else {
    for (const charge of data.charges.slice(0, 80)) {
      ensureSpace(28);
      drawText(
        `${charge.period} · ${charge.chargeType} · due ${formatMoney(charge.amountDue, currency)} · paid ${formatMoney(charge.amountPaid, currency)} · bal ${formatMoney(charge.balance, currency)} · ${charge.status}`,
        { size: 8, max: 100 },
      );
    }
  }

  section("3. Payment history");
  if (data.payments.length === 0) {
    drawText("No payment records in selected window.", { color: muted });
  } else {
    for (const payment of data.payments.slice(0, 80)) {
      ensureSpace(28);
      const ref = payment.reference ? ` · ref ${payment.reference}` : "";
      drawText(
        `${formatDate(payment.at)} · ${formatMoney(payment.amount, currency)} · ${payment.method} · ${payment.status}${payment.targetType ? ` · ${payment.targetType}` : ""}${payment.period ? ` · ${payment.period}` : ""}${ref}`,
        { size: 8, max: 100 },
      );
    }
  }

  section("4. Communication log");
  if (data.communications.length === 0) {
    drawText("No communication logs in selected window.", { color: muted });
  } else {
    for (const row of data.communications.slice(0, 100)) {
      ensureSpace(36);
      drawText(
        `${formatDate(row.at)} · ${row.channel}${row.direction ? ` · ${row.direction}` : ""}${row.actor ? ` · ${row.actor}` : ""}`,
        { size: 8, font: bold, max: 100 },
      );
      if (row.subject) drawText(row.subject, { size: 8, max: 100 });
      drawText(row.summary, { size: 8, color: muted, max: 100 });
      y -= 4;
    }
  }

  if (data.notes?.length) {
    section("5. Notes");
    for (const note of data.notes) {
      drawText(`• ${note}`, { size: 8, max: 95 });
    }
  }

  ensureSpace(40);
  y -= 10;
  page.drawText(
    "This pack is an operational export from EstateDesk. It is not legal advice.",
    { x, y, size: 7, font: regular, color: muted },
  );

  return pdf.save({ useObjectStreams: false, addDefaultPage: false });
}
