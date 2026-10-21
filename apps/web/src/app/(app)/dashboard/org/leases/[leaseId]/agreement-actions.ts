"use server";
import { scopedUnitWhere } from "@/lib/permissions/record-scope";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgPermission } from "@/lib/permissions/guards";
import { generateLeaseAgreementPdf } from "@/lib/documents/lease-agreement-pdf";
import { encodePublicId } from "@/lib/public-id";
export async function saveLeaseAgreement(_state: { message: string }, form: FormData) {
  const session = await requireOrgPermission("leases.manage");
  const leaseId = String(form.get("leaseId") || "");
  const title = String(form.get("title") || "").trim();
  const landlordName = String(form.get("landlordName") || "").trim();
  const terms = String(form.get("terms") || "").trim();
  const accentColor = String(form.get("accentColor") || "#0a6452");
  const fontFamily = String(form.get("fontFamily") || "sans");
  const footerText = String(form.get("footerText") || "").trim();
  const isOrgTemplate = form.get("saveAsTemplate") === "on";
  if (!/^#[0-9a-f]{6}$/i.test(accentColor) || !["sans", "serif"].includes(fontFamily) || footerText.length > 200) return { message: "Choose a valid color, font, and footer (up to 200 characters)." };
  if (!title || title.length > 150 || !landlordName || landlordName.length > 200 || !terms || terms.length > 20000) return { message: "Enter a title, landlord name, and terms (up to 20,000 characters)." };
  try {
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Lease" WHERE "id" = ${leaseId} AND "orgId" = ${session.activeOrgId} FOR UPDATE`;
      const lease = await tx.lease.findFirst({ where: { id: leaseId, orgId: session.activeOrgId!, deletedAt: null, unit: scopedUnitWhere(session.activeOrgId!, session.membershipScope), tenant: { deletedAt: null } }, include: { org: true, tenant: true, unit: { include: { property: true, building: true } } } });
      if (!lease) throw new Error("Lease not found.");
      const pending = await tx.leaseSignatureEnvelope.count({ where: { leaseId, status: { in: ["PENDING", "PARTIALLY_SIGNED", "FINALIZING"] } } });
      if (pending) throw new Error("Cancel the current signing request before changing this agreement.");
      const money = (value: unknown) => new Intl.NumberFormat("en-KE", { style: "currency", currency: lease.org.currencyCode }).format(Number(value ?? 0));
      const date = (value: Date) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeZone: "Africa/Nairobi" }).format(value);
      const bytes = await generateLeaseAgreementPdf({
        title, landlordName, organizationName: lease.org.name, tenantName: lease.tenant.fullName,
        premises: [lease.unit.property.name, lease.unit.building?.name, `Unit ${lease.unit.houseNo}`].filter(Boolean).join(" / "),
        leaseId, startDate: date(lease.startDate), endDate: lease.endDate ? date(lease.endDate) : "Open-ended",
        monthlyRent: money(lease.monthlyRent), deposit: money(lease.deposit), dueDay: lease.dueDay, terms, accentColor, fontFamily: fontFamily as "sans" | "serif", footerText,
      });
      const assetId = randomUUID();
      const asset = await tx.asset.create({ data: {
        id: assetId, orgId: lease.orgId, fileName: `lease-agreement-${lease.id}.pdf`, fileType: "application/pdf",
        mimeType: "application/pdf", key: `database:${assetId}`, size: bytes.length, assetType: "CONTRACT", uploadedByUserId: session.userId,
        metadata: { purpose: "generated_lease_agreement", title, landlordName, terms, accentColor, fontFamily, footerText, isOrgTemplate, pdfBase64: Buffer.from(bytes).toString("base64") },
      } });
      await tx.lease.update({ where: { id: lease.id }, data: { contractDocumentId: asset.id } });
    }, { timeout: 15000 });
    revalidatePath(`/dashboard/org/leases/${encodePublicId(leaseId, "lease")}`);
    revalidatePath("/dashboard/tenant/lease"); revalidatePath("/dashboard/tenant/documents");
    return { message: isOrgTemplate ? "Agreement saved and set as the organization template for future agreements. Open online signing to request the tenant’s signature." : "Agreement saved. Open online signing to request the tenant’s signature." };
  } catch (error) {
    console.error("Lease agreement generation failed", error);
    return { message: error instanceof Error && /Lease not found|Cancel the current/.test(error.message) ? error.message : "Could not save the agreement. Please try again." };
  }
}
