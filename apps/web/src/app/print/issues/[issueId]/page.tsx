import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { decodePublicId } from "@/lib/public-id";
import { getCaretakerManageableIssue } from "@/app/(app)/dashboard/caretaker/issues/_lib/access";
import { getIssueSlaState } from "@/app/(app)/dashboard/caretaker/_lib/sla";
import AutoPrint from "../../inspections/[inspectionId]/AutoPrint";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ issueId: string }>;
};

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function PrintIssueWorkOrderPage({ params }: PageProps) {
  const session = await requireUserSession();
  const { issueId: publicIssueId } = await params;

  if (!session.activeOrgId || session.activeOrgRole !== "CARETAKER") {
    notFound();
  }

  const issueId = decodePublicId(publicIssueId, "issue");
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
      assignedTo: { select: { fullName: true, phone: true } },
      reportedBy: { select: { fullName: true, phone: true } },
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

  return (
    <div className="min-h-screen bg-white px-6 py-8 text-slate-900 print:px-0 print:py-0">
      <AutoPrint />

      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              EstateDesk work order
            </p>
            <h1 className="mt-2 text-2xl font-semibold">{issue.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{location}</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>Priority: {issue.priority}</p>
            <p>Status: {issue.status.replaceAll("_", " ")}</p>
            {sla ? <p>SLA: {sla.label}</p> : null}
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Description
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-6">{issue.description}</p>
        </section>

        {issue.resolutionNotes ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Progress notes
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-6">
              {issue.resolutionNotes}
            </p>
          </section>
        ) : null}

        <section className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="font-semibold">Reporter</p>
            <p className="mt-1">{issue.reportedBy.fullName}</p>
            <p>{issue.reportedBy.phone ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="font-semibold">Assigned caretaker</p>
            <p className="mt-1">{issue.assignedTo?.fullName ?? "Unassigned"}</p>
            <p>{issue.assignedTo?.phone ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="font-semibold">Tenant</p>
            <p className="mt-1">{tenant?.fullName ?? "—"}</p>
            <p>{tenant?.phone ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="font-semibold">Timestamps</p>
            <p className="mt-1">Created: {formatDateTime(issue.createdAt)}</p>
            <p>Updated: {formatDateTime(issue.updatedAt)}</p>
          </div>
        </section>

        <section className="rounded-lg border border-dashed border-slate-300 p-4 text-sm">
          <p className="font-semibold">Caretaker sign-off</p>
          <div className="mt-8 border-b border-slate-400" />
          <p className="mt-2 text-slate-500">Name / signature / date</p>
        </section>

        <div className="print:hidden">
          <Link
            href={`/dashboard/caretaker/issues/${publicIssueId}`}
            className="text-sm font-medium text-slate-700 underline"
          >
            Back to issue
          </Link>
        </div>
      </div>
    </div>
  );
}