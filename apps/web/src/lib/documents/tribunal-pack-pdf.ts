import { createProfessionalPdf } from "./professional-pdf";

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

/** Operational evidence export; text is wrapped and paginated without dropping records. */
export async function generateTribunalPackPdf(data: TribunalPackData): Promise<Uint8Array> {
  const currency = data.currencyCode || "KES";
  const money = (amount: number) => formatMoney(amount, currency);
  const doc = await createProfessionalPdf({ title: "Rent Restriction Tribunal Pack", serialNumber: `EXPORT-${data.generatedAt.toISOString()}`, organizationName: data.organizationName, issuedAt: data.generatedAt });
  doc.paragraph(data.organizationName, { size: 18, strong: true });
  if (data.organizationAddress) doc.paragraph(data.organizationAddress);
  doc.paragraph(`Generated: ${formatDate(data.generatedAt)}`);
  doc.paragraph("Time-stamped communications and financial history for tribunal filing support. Verify against source records before submission.");
  doc.section("1. Parties and tenancy");
  doc.details([["Tenant", data.tenantName], ["Phone", data.tenantPhone], ["National ID", data.tenantNationalId], ["Property", data.propertyName], ["Unit", data.unitLabel], ["Lease start", formatDate(data.leaseStart)], ["Lease end", formatDate(data.leaseEnd)], ["Monthly rent", data.monthlyRent == null ? "Not supplied" : money(data.monthlyRent)]]);
  doc.section(`2. Charge history (${data.charges.length} records)`);
  if (!data.charges.length) doc.paragraph("No charge records in selected window.");
  else doc.table([{ label: "Period / type", width: 135.28 }, { label: "Due / status", width: 110 }, { label: "Billed", width: 90, right: true }, { label: "Paid", width: 90, right: true }, { label: "Balance", width: 90, right: true }], data.charges.map(charge => [`${charge.period}\n${charge.chargeType}`, `${formatDate(charge.dueDate)}\n${charge.status}`, money(charge.amountDue), money(charge.amountPaid), money(charge.balance)]));
  doc.section(`3. Payment history (${data.payments.length} records)`);
  if (!data.payments.length) doc.paragraph("No payment records in selected window.");
  else doc.table([{ label: "Date / method", width: 130 }, { label: "Reference / period", width: 170 }, { label: "Status", width: 115.28 }, { label: "Amount", width: 100, right: true }], data.payments.map(payment => [`${formatDate(payment.at)}\n${payment.method}`, [payment.reference, payment.targetType, payment.period].filter(Boolean).join("\n") || "Not supplied", payment.status, money(payment.amount)]));
  doc.section(`4. Communication log (${data.communications.length} records)`);
  if (!data.communications.length) doc.paragraph("No communication logs in selected window.");
  for (const [index, row] of data.communications.entries()) {
    doc.paragraph(`${index + 1}. ${formatDate(row.at)} | ${row.channel}${row.direction ? ` | ${row.direction}` : ""}`, { strong: true });
    if (row.actor) doc.paragraph(`Actor: ${row.actor}`);
    if (row.subject) doc.paragraph(row.subject, { strong: true });
    doc.paragraph(row.summary);
  }
  if (data.notes?.length) {
    doc.section("5. Export notes");
    data.notes.forEach(note => doc.paragraph(note));
  }
  doc.paragraph("Characters unavailable in the PDF font are represented by their Unicode code points, for example [U+1F514]. Original message text remains in the source records.", { size: 8 });
  doc.paragraph("This pack is an operational export from EstateDesk. It is not legal advice.", { size: 8 });
  return doc.save();
}
