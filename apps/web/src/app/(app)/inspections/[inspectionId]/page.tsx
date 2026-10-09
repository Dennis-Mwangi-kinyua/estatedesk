import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CalendarDays, ClipboardCheck, MapPin, UserRound } from "lucide-react";
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
  const inspection = await prisma.inspection.findFirst({
    where: { id: decodePublicId(inspectionId, "inspection"), notice: { lease: { orgId: session.activeOrgId!, deletedAt: null } } },
    include: {
      inspector: { select: { fullName: true } },
      notice: { include: { tenant: { select: { fullName: true } }, lease: { include: { unit: { include: { property: { select: { name: true } } } } } } } },
    },
  });
  if (!inspection) notFound();

  const memberships = await prisma.membership.findMany({ where: { userId: session.userId, orgId: session.activeOrgId!, role: { not: "TENANT" }, employmentEndedAt: null, deactivatedAt: null } });
  if (!canInspectUnit(memberships, inspection.notice.lease.unit)) notFound();

  const unit = inspection.notice.lease.unit;
  const scheduled = inspection.status === "SCHEDULED" && inspection.notice.status === "INSPECTION_SCHEDULED";
  const backHref = session.activeOrgRole === "CARETAKER" ? "/dashboard/caretaker/inspections" : "/dashboard/org/inspections";
  return (
    <main className="estate-workspace mx-auto w-full max-w-none space-y-5 px-4 pb-24 pt-4 sm:space-y-6 sm:px-6 lg:px-8">
      <header className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="p-4 sm:p-6 lg:p-8">
          <Link href={backHref} className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"><ArrowLeft aria-hidden="true" className="size-4" />Back to inspections</Link>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><ClipboardCheck aria-hidden="true" className="size-6" /></span><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Field inspection</p><h1 className="mt-1 break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{inspection.notice.tenant.fullName}</h1><p className="mt-1 text-sm text-muted-foreground">Complete the checklist and send your findings to management.</p></div></div>
            <span className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${scheduled ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200" : inspection.status === "COMPLETED" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200" : "border-border bg-muted/30 text-muted-foreground"}`}><span className="size-1.5 rounded-full bg-current" />{scheduled ? "Ready to inspect" : inspection.status.toLowerCase()}</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Info icon={<CalendarDays />} label="Appointment" value={formatDateTime(inspection.scheduledAt)} />
            <Info icon={<MapPin />} label="Property and unit" value={`${unit.property.name} · Unit ${unit.houseNo}`} />
            <Info icon={<UserRound />} label="Assigned inspector" value={inspection.inspector.fullName} />
            <Info icon={<UserRound />} label="Tenant" value={inspection.notice.tenant.fullName} />
          </div>
        </div>
        <div className="border-t border-border bg-muted/10 px-4 py-4 sm:px-6 lg:px-8"><MoveOutProgress status={inspection.notice.status} /></div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-4 sm:px-6"><h2 className="text-lg font-semibold text-foreground">{scheduled ? "Inspection report" : inspection.status === "COMPLETED" ? "Submitted report" : "Inspection details"}</h2><p className="mt-1 text-sm text-muted-foreground">{scheduled ? "Record the property condition, add supporting photos, and submit for review." : "Review the inspection status and submitted notes."}</p></div>
        <div className="p-4 sm:p-6 lg:p-8">{scheduled ? <InspectionReportForm inspectionId={inspection.id} /> : <div className="rounded-2xl border border-border bg-muted/10 p-4 sm:p-5"><p className="text-sm font-medium text-muted-foreground">Report notes</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{inspection.notes ?? "No report notes have been submitted."}</p></div>}</div>
      </section>
    </main>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-border bg-muted/10 p-3.5"><span className="mt-0.5 shrink-0 text-primary [&>svg]:size-4">{icon}</span><div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-semibold leading-5 text-foreground">{value}</p></div></div>;
}
