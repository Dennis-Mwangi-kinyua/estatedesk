import { PDFDocument } from "pdf-lib";
import { createProfessionalPdf } from "./professional-pdf";

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

/** Append a clear registration certificate while preserving every source contract page. */
export async function generateVerifiedLeasePdf(contractBytes: Uint8Array, data: VerifiedLeasePdfData) {
  const doc = await createProfessionalPdf({ ...data, title: "Lease verification", pageLabel: "Certificate page", footerText: "EstateDesk | Registration certificate appended to the original contract." });
  doc.paragraph(data.organizationName, { size: 18, strong: true });
  if (data.organizationAddress) doc.paragraph(data.organizationAddress);
  doc.paragraph(data.tenantBelongsToOrg ? "Tenant registration confirmed in this organisation." : "Tenant organisation registration could not be confirmed.", { strong: true });
  doc.section("Tenant registration");
  doc.details([["Full name", data.tenantName], ["Tenant reference", data.tenantId], ["Phone", data.tenantPhone], ["Email", data.tenantEmail], ["National ID (masked)", data.tenantNationalIdMasked], ["Tenant status", label(data.tenantStatus)]]);
  doc.section("Premises and lease");
  doc.details([["Property", data.propertyName], ["Building", data.buildingName || "Not applicable"], ["Unit", data.unitName], ["Lease reference", data.leaseId], ["Lease status", label(data.leaseStatus)], ["Lease start", formatDate(data.startDate)], ["Lease end", data.endDate ? formatDate(data.endDate) : "Open-ended"], ["Monthly rent", formatMoney(data.monthlyRent, data.currencyCode)], ["Security deposit", data.deposit == null ? "Not recorded" : formatMoney(data.deposit, data.currencyCode)], ["Rent due day", `Day ${data.dueDay}`]]);
  doc.section("Source contract");
  doc.details([["Contract filename", data.contractFileName], ["Contract SHA-256", data.sourceContractHash], ["Certificate issued", formatDate(data.issuedAt)]]);
  await doc.verification("Scan to confirm this document's serial number, tenant registration, premises, lease terms and current status. This certificate does not replace the source contract or its signatures.");
  const certificate = await PDFDocument.load(await doc.save());
  const pdf = await PDFDocument.load(contractBytes);
  pdf.setTitle(`Lease ${data.serialNumber}`);
  pdf.setAuthor(data.organizationName);
  pdf.setSubject("Verified tenancy lease");
  pdf.setCreator("EstateDesk Document Trust");
  pdf.setProducer("EstateDesk Document Trust");
  pdf.setCreationDate(data.issuedAt);
  pdf.setModificationDate(data.issuedAt);
  for (const page of await pdf.copyPages(certificate, certificate.getPageIndices())) pdf.addPage(page);
  return pdf.save({ useObjectStreams: false });
}
