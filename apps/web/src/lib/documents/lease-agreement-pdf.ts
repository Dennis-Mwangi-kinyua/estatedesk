import { createProfessionalPdf } from "./professional-pdf";

export const DEFAULT_LEASE_TERMS = `Use of premises: The premises are to be used for the purpose agreed by the parties.
Rent and utilities: Rent is payable on the due day shown above. The parties should specify utility charges and payment instructions here.
Care of premises: The tenant will take reasonable care of the premises and report maintenance concerns to management.
Deposit: The parties should specify deposit deductions, inspection requirements, and return arrangements here.
Notice and termination: The parties should specify the agreed notice period and termination arrangements here.
Additional conditions: Add any property-specific conditions agreed by both parties.`;
export type LeaseAgreementData = {
  title: string; landlordName: string; organizationName: string; tenantName: string;
  premises: string; leaseId: string; startDate: string; endDate: string;
  monthlyRent: string; deposit: string; dueDay: number; terms: string;
};
export async function generateLeaseAgreementPdf(data: LeaseAgreementData) {
  const doc = await createProfessionalPdf({ title: "Lease agreement", documentTitle: data.title, serialNumber: data.leaseId, organizationName: data.organizationName, issuedAt: new Date(), footerText: "EstateDesk | Lease agreement | Signatures as agreed by the parties." });
  doc.paragraph(data.title, { size: 18, strong: true });
  doc.paragraph(`Prepared by ${data.organizationName}`);
  doc.section("1. Parties and premises");
  doc.details([["Landlord / lessor", data.landlordName], ["Tenant", data.tenantName], ["Premises", data.premises], ["Lease reference", data.leaseId]]);
  doc.section("2. Term and financial details");
  doc.details([["Start date", data.startDate], ["End date", data.endDate], ["Monthly rent", data.monthlyRent], ["Security deposit", data.deposit], ["Rent due day", `Day ${data.dueDay}`]]);
  doc.section("3. Agreed terms");
  for (const paragraph of data.terms.split(/\r?\n/)) doc.paragraph(paragraph, { size: 10 });
  doc.section("4. Signatures");
  for (const party of ["Landlord / management", "Tenant", "Witness (if applicable)"]) {
    doc.paragraph(party, { strong: true });
    doc.paragraph("Name: __________________________  Signature: __________________________");
    doc.paragraph("Date: __________________________");
  }
  return doc.save();
}
