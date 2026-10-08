import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.setTitle(data.title); pdf.setAuthor(data.organizationName); pdf.setCreator("EstateDesk");
  let page = pdf.addPage([595.28, 841.89]);
  let y = 790;
  const sanitize = (text: string) => Array.from(text).map(char => {
    try { font.encodeText(char); return char; } catch { return "?"; }
  }).join("");
  const line = (text: string, heading = false) => {
    const words = sanitize(text).split(/\s+/);
    let current = "";
    const draw = (value: string) => {
      if (y < 65) { page = pdf.addPage([595.28, 841.89]); y = 790; }
      page.drawText(value, { x: 46, y, size: heading ? 13 : 10, font: heading ? bold : font, color: rgb(0.08,0.1,0.14) }); y -= heading ? 24 : 16;
    };
    for (const word of words) {
      // Split long unbroken input so custom clauses cannot overflow the page.
      let remainder = word;
      while (remainder.length > 70) { if (current) { draw(current); current = ""; } draw(remainder.slice(0,70)); remainder = remainder.slice(70); }
      const candidate = current ? `${current} ${remainder}` : remainder;
      if ((heading ? bold : font).widthOfTextAtSize(candidate, heading ? 13 : 10) > 500 && current) { draw(current); current = remainder; } else current = candidate;
    }
    if (current) draw(current);
    y -= 5;
  };
  line(data.title, true);
  line(`Prepared by ${data.organizationName}`);
  line(`Lease reference: ${data.leaseId}`);
  line("Parties and premises", true);
  line(`Landlord / lessor: ${data.landlordName}`);
  line(`Tenant: ${data.tenantName}`);
  line(`Premises: ${data.premises}`);
  line(`Term: ${data.startDate} to ${data.endDate}`);
  line(`Monthly rent: ${data.monthlyRent}; security deposit: ${data.deposit}; rent due day: ${data.dueDay}`);
  line("Agreed terms", true);
  for (const paragraph of data.terms.split(/\r?\n/)) line(paragraph);
  line("Signatures", true);
  line("Landlord / management: ____________________   Date: ______________");
  line("Tenant: __________________________________   Date: ______________");
  line("Witness (if applicable): ___________________   Date: ______________");
  pdf.getPages().forEach((page, index) => page.drawText(`EstateDesk | Page ${index + 1} of ${pdf.getPageCount()}`, { x: 46, y: 30, size: 8, font }));
  return pdf.save();
}
