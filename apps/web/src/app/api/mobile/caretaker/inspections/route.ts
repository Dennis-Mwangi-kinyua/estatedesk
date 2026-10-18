import { prisma } from "@/lib/prisma";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute, actionResult } from "@/lib/mobile/route";
import { nativeForm } from "@/lib/mobile/form";
import { mobileInspectionFields, mobileInspectionInputSchema } from "@estatedesk/contracts/mobile";
import { completeInspectionAction } from "@/features/inspections/actions/complete-inspection-action";
export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const rows = await prisma.inspection.findMany({ where: { inspectorUserId: session.userId, notice: { lease: { orgId: session.activeOrgId!, deletedAt: null } } }, orderBy: [{ scheduledAt: "desc" }, { id: "desc" }], take: 100, select: { id: true, referenceCode: true, status: true, scheduledAt: true, notes: true, checklist: true, notice: { select: { lease: { select: { unit: { select: { houseNo: true, property: { select: { name: true } } } } } } } } } });
    return mobileJson(rows.map(i => ({ id: i.id, reference: i.referenceCode, status: i.status, scheduledAt: i.scheduledAt.toISOString(), summary: i.notes, recommendations: i.checklist && typeof i.checklist === "object" && !Array.isArray(i.checklist) && typeof i.checklist.recommendations === "string" ? i.checklist.recommendations : null, unit: i.notice.lease.unit.houseNo, property: i.notice.lease.unit.property.name })));
  }, { role: "CARETAKER" });
}
export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    const { input, form } = await nativeForm(request, mobileInspectionInputSchema, mobileInspectionFields.map(field => `photo_${field.name}`));
    const inspection = await prisma.inspection.findFirst({ where: { id: input.inspectionId, inspectorUserId: session.userId, notice: { lease: { orgId: session.activeOrgId!, deletedAt: null } } }, select: { id: true } });
    if (!inspection) return mobileJson({ error: "Inspection not found in your assignments." }, 404);
    return actionResult(() => completeInspectionAction(form), "/dashboard/caretaker/inspections");
  }, { role: "CARETAKER" });
}
