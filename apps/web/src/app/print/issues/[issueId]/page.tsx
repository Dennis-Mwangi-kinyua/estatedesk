import { createHash } from "node:crypto";
import QRCode from "qrcode";
import { getSiteUrl } from "@/lib/seo";
import { PrintedWorkOrder } from "@/components/issues/printed-work-order";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { decodePublicSlug, encodePublicId } from "@/lib/public-id";
import { getCaretakerManageableIssue } from "@/app/(app)/dashboard/caretaker/issues/_lib/access";
import { getIssueSlaState } from "@/app/(app)/dashboard/caretaker/_lib/sla";
import AutoPrint from "../../inspections/[inspectionId]/AutoPrint";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ issueId: string }>;
};

export default async function PrintIssueWorkOrderPage({ params }: PageProps) {
  const session = await requireUserSession();
  const { issueId: publicIssueId } = await params;

  if (!session.activeOrgId || session.activeOrgRole !== "CARETAKER") {
    notFound();
  }

  const issueId = decodePublicSlug(publicIssueId, "issue");
  const manageable = await getCaretakerManageableIssue({
    orgId: session.activeOrgId,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    issueId,
  });

  if (!manageable) {
    notFound();
  }

  const issue = await prisma.issueTicket.findFirst({
    where: {
      id: issueId,
      orgId: session.activeOrgId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      priority: true,
      status: true,
      resolutionNotes: true,
      createdAt: true,
      updatedAt: true,
      property: { select: { name: true } },
      unit: {
        select: {
          houseNo: true,
          property: { select: { name: true } },
          building: { select: { name: true } },
          leases: {
            where: { status: "ACTIVE", deletedAt: null },
            take: 1,
            select: {
              tenant: {
                select: { fullName: true, phone: true },
              },
            },
          },
        },
      },
      org: { select: { name: true, address: true, phone: true, email: true } },
      assignedBy: { select: { fullName: true, phone: true, email: true } },
      assignedTo: { select: { fullName: true, phone: true, email: true } },
      reportedBy: { select: { fullName: true, phone: true, email: true } },
    },
  });

  if (!issue) {
    notFound();
  }

  const sla = getIssueSlaState({
    createdAt: issue.createdAt,
    priority: issue.priority,
    status: issue.status,
  });

  const location = issue.unit
    ? [
        issue.unit.property.name,
        issue.unit.building?.name,
        `Unit ${issue.unit.houseNo}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : issue.property?.name ?? "—";

  const tenant = issue.unit?.leases[0]?.tenant ?? null;

  const issuePath = `/dashboard/caretaker/issues/${encodePublicId(issue.id, "issue")}`;
  const issueUrl = `${getSiteUrl()}${issuePath}`;
  const qrDataUrl = await QRCode.toDataURL(issueUrl, { width: 240, margin: 1, errorCorrectionLevel: "M" });
  const reference = `WO-${issue.createdAt.getFullYear()}-${createHash("sha256").update(issue.id).digest("hex").slice(0, 10).toUpperCase()}`;
  return <div className="min-h-screen bg-slate-100 px-3 py-6 text-slate-900 print:bg-white print:p-0">
    <AutoPrint />
    <div className="mx-auto max-w-3xl print:hidden"><Link href={issuePath} className="inline-flex min-h-11 items-center text-sm font-medium text-slate-700 underline">Back to issue</Link></div>
    <PrintedWorkOrder data={{ reference, organization: issue.org, title: issue.title, description: issue.description, location, priority: issue.priority, status: issue.status, createdAt: issue.createdAt, updatedAt: issue.updatedAt, printedAt: new Date(), printedBy: session.fullName, assignedTo: issue.assignedTo, assignedBy: issue.assignedBy, reportedBy: issue.reportedBy, tenant, notes: issue.resolutionNotes, qrDataUrl, issueUrl, responseTarget: sla?.label ?? null }} />
  </div>;
}
