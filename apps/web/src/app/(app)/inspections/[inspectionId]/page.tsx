import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { decodePublicId } from "@/lib/public-id";
import { canInspectUnit } from "@/lib/move-outs/inspection-scope";
import { InspectionReportForm } from "@/features/inspections/inspection-report-form";
import { MoveOutProgress } from "@/features/move-outs/components/progress";
import { formatDateTime } from "@/lib/formatters";
export const dynamic = "force-dynamic";
export default async function InspectionPage({ params }: { params: Promise<{ inspectionId: string }> }) {
  const session = await requireUserSession();
  const { inspectionId } = await params;
  const inspection = await prisma.inspection.findFirst({ where: { id: decodePublicId(inspectionId, "inspection"), notice: { lease: { orgId: session.activeOrgId!, deletedAt: null } } }, include: { inspector: { select: { fullName: true } }, notice: { include: { tenant: { select: { fullName: true } }, lease: { include: { unit: { include: { property: { select: { name: true } } } } } } } } } });
  if (!inspection) notFound();
  const memberships = await prisma.membership.findMany({ where: { userId: session.userId, orgId: session.activeOrgId!, role: { not: "TENANT" }, employmentEndedAt: null, deactivatedAt: null } });
  if (!canInspectUnit(memberships, inspection.notice.lease.unit)) notFound();
  return <main className="estate-workspace mx-auto max-w-4xl space-y-5 p-4 sm:p-6"><header className="rounded-2xl border border-border bg-card p-5"><h1 className="text-2xl font-semibold">Move-out inspection</h1><p className="mt-2 text-sm text-muted-foreground">{inspection.notice.lease.unit.property.name} · Unit {inspection.notice.lease.unit.houseNo} · {inspection.notice.tenant.fullName}</p><p className="mt-2 text-xs text-muted-foreground">Scheduled: {formatDateTime(inspection.scheduledAt)} · Assigned to {inspection.inspector.fullName}</p></header><MoveOutProgress status={inspection.notice.status} /><section className="rounded-2xl border border-border bg-card p-5">{inspection.status === "SCHEDULED" ? <InspectionReportForm inspectionId={inspection.id} /> : <><h2 className="font-semibold">{inspection.status === "COMPLETED" ? "Submitted inspection report" : "Inspection cancelled"}</h2><p className="mt-3 whitespace-pre-wrap text-sm">{inspection.notes ?? "No report has been submitted."}</p></>}</section></main>;
}
