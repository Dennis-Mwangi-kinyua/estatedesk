import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";
import { notFound } from "next/navigation";
import Link from "@/components/navigation/workspace-link";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { decodePublicId, encodePublicId } from "@/lib/public-id";
import { latestArrearsApproval } from "@/lib/move-outs/arrears-approval";
import { nairobiDate } from "@/lib/move-outs/validation";
import { CloseoutForm } from "@/features/move-outs/components/closeout-form";
import { ArrearsReview } from "@/features/move-outs/components/arrears-review";
import { MoveOutProgress } from "@/features/move-outs/components/progress";
import { SettlementSummary } from "@/features/move-outs/components/settlement-summary";
import { closeMoveOutAction } from "@/app/(app)/move-outs/_lib/actions";

export const dynamic = "force-dynamic";
export default async function HandoverPage({ params }: { params: Promise<{ noticeId: string }> }) {
  const session = await requireManagementAccess();
  const noticeId = decodePublicId((await params).noticeId, "move-out-notice");
  const notice = await prisma.moveOutNotice.findFirst({ where: { id: noticeId, lease: { orgId: session.activeOrgId!, deletedAt: null } }, include: { tenant: true, inspection: true, lease: { include: { unit: { include: { property: true } } } } } });
  if (!notice) notFound();
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: session.activeOrgId! }, select: { currencyCode: true } });
  const approval = await latestArrearsApproval(prisma, session.activeOrgId!, notice.id);
  return <div className="mx-auto w-full min-w-0 space-y-6 px-4 py-6 pb-28 text-foreground sm:px-6 lg:px-8">
    <Link href="/dashboard/org/move-outs" className="inline-flex min-h-11 items-center text-sm font-medium text-primary">← Back to move-outs</Link>
    <header className="space-y-3 rounded-3xl border border-border bg-card p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tenant move-out and clearance</p><h1 className="text-2xl font-semibold sm:text-3xl">{notice.tenant.fullName} — handover</h1><p className="text-sm text-muted-foreground">{notice.lease.unit.property.name} · Unit {notice.lease.unit.houseNo}</p><MoveOutProgress status={notice.status} closeout={notice.closeout} approvalStatus={approval?.action} /></header>
    {approval && <section className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-8"><h2 className="text-lg font-semibold">Arrears approval review</h2><p className="text-sm font-medium">{approval.action === "MOVE_OUT_ARREARS_REQUESTED" ? "Awaiting approval" : approval.action === "MOVE_OUT_ARREARS_APPROVED" ? "Approved for the reviewed settlement" : "Request rejected"}</p><dl className="grid gap-4 text-sm sm:grid-cols-3"><div><dt className="text-muted-foreground">Remaining amount owed</dt><dd className="mt-1 font-semibold">{Number(approval.metadata.amountOwed ?? 0).toFixed(2)} {org.currencyCode}</dd></div><div><dt className="text-muted-foreground">Requested handover date</dt><dd className="mt-1">{String(approval.metadata.date ?? "")}</dd></div><div><dt className="text-muted-foreground">Request reason</dt><dd className="mt-1 whitespace-pre-wrap break-words">{String(approval.metadata.reason ?? "")}</dd></div></dl><SettlementSummary closeout={approval.metadata} />{approval.metadata.reviewNote && <p className="text-sm">Approver note: {String(approval.metadata.reviewNote)}</p>}{approval.action === "MOVE_OUT_ARREARS_REQUESTED" && notice.status === "INSPECTION_COMPLETED" && (memberHasOrgPermission(session, "move-outs.arrears.approve") ? <ArrearsReview noticeId={notice.id} requestId={approval.id} /> : <p className="text-sm text-muted-foreground">An admin or authorised approver has been notified. Handover remains blocked until approval.</p>)}</section>}
    {notice.status === "INSPECTION_COMPLETED" ? <CloseoutForm approvalRevision={approval?.id} noticeId={notice.id} dateLimit={nairobiDate()} action={closeMoveOutAction} /> : notice.status === "CLOSED" ? <section className="rounded-3xl border border-border bg-card p-5"><h2 className="mb-4 text-lg font-semibold">Handover completed</h2><SettlementSummary closeout={notice.closeout} /></section> : <section className="space-y-4 rounded-3xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">Complete inspection before handover</h2><p className="text-sm text-muted-foreground">Schedule and complete the inspection from the move-out desk, then return here to review the settlement.</p>{notice.inspection && <Link href={`/dashboard/org/inspections/${encodePublicId(notice.inspection.id, "inspection")}`} className="inline-flex min-h-11 items-center text-primary">Open inspection</Link>}</section>}
  </div>;
}
