import Link from "next/link";
import {
  getCaretakerMeterEntryHref,
  getCaretakerNewIssueHref,
  getCaretakerIssueHref,
} from "@/app/(app)/dashboard/caretaker/_lib/paths";
import {
  formatCurrency,
  formatDate,
} from "@/app/(app)/dashboard/caretaker/water-bills/_lib/helpers";
import { getBillHref, getReadingHref } from "@/app/(app)/dashboard/caretaker/water-bills/_components/water-bills-ui";
import {
  getPriorityClass,
  getStatusClass,
} from "@/app/(app)/dashboard/caretaker/issues/_lib/helpers";
import { ContactActions } from "@/app/(app)/dashboard/caretaker/_components/contact-actions";
import { IssueSlaBadge } from "@/app/(app)/dashboard/caretaker/_components/issue-sla-badge";
import {
  MiniMetric,
  panelBodyClassName,
  panelShellClassName,
  QuickLinkCard,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { AlertTriangle, ClipboardList, Droplets, FileText, Wrench } from "lucide-react";
import type { CaretakerUnitDetailPageData } from "../_lib/types";

export function UnitDetailSections({
  data,
}: {
  data: Extract<CaretakerUnitDetailPageData, { ok: true }>;
}) {
  const { unit, activeLease, currentPeriodReading, openIssues, period } = data;

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniMetric label="Open issues" value={String(openIssues)} />
        <MiniMetric
          label="Period reading"
          value={currentPeriodReading ? "Submitted" : "Pending"}
        />
        <MiniMetric
          label="Bedrooms"
          value={unit.bedrooms ? String(unit.bedrooms) : "—"}
        />
        <MiniMetric label="Rent" value={formatCurrency(unit.rentAmount)} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLinkCard
          href={getCaretakerNewIssueHref({ unitId: unit.id })}
          title="Report issue"
          description="Log maintenance for this apartment."
          icon={Wrench}
        />
        <QuickLinkCard
          href={getCaretakerNewIssueHref({ unitId: unit.id, template: "emergency" })}
          title="Emergency"
          description="Urgent safety or access issue."
          icon={AlertTriangle}
        />
        <QuickLinkCard
          href={getCaretakerMeterEntryHref(unit.id, period)}
          title="Enter meter reading"
          description={`Capture period ${period} usage.`}
          icon={Droplets}
        />
        <QuickLinkCard
          href="/dashboard/caretaker/leases"
          title="Lease records"
          description="Review lease status and dates."
          icon={FileText}
        />
        <QuickLinkCard
          href="/dashboard/caretaker/inspections"
          title="Inspections"
          description="Check move-out tasks in your scope."
          icon={ClipboardList}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={panelShellClassName}>
          <SectionIntro eyebrow="Tenant" title="Occupancy details" />
          <div className={`space-y-4 ${panelBodyClassName} pt-0`}>
            {activeLease ? (
              <>
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-sm text-muted-foreground">Active tenant</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {activeLease.tenant.fullName}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {activeLease.tenant.phone ?? "—"}
                    {activeLease.tenant.email
                      ? ` · ${activeLease.tenant.email}`
                      : ""}
                  </p>
                  <div className="mt-3">
                    <ContactActions
                      phone={activeLease.tenant.phone}
                      email={activeLease.tenant.email}
                      compact
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-muted/10 p-4">
                    <p className="text-xs text-muted-foreground">Lease start</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatDate(activeLease.startDate)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/10 p-4">
                    <p className="text-xs text-muted-foreground">Lease end</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatDate(activeLease.endDate)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
                This unit is not currently occupied.
              </div>
            )}

            {unit.notes ? (
              <div className="rounded-2xl border border-border bg-muted/10 p-4">
                <p className="text-sm text-muted-foreground">Office notes</p>
                <p className="mt-1 text-sm text-foreground">{unit.notes}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className={panelShellClassName}>
          <SectionIntro eyebrow="Billing" title="Water & utilities" />
          <div className={`space-y-4 ${panelBodyClassName} pt-0`}>
            {currentPeriodReading ? (
              <div className="rounded-2xl border border-border bg-muted/10 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Period {currentPeriodReading.period}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentPeriodReading.currentReading} units ·{" "}
                  {currentPeriodReading.status}
                </p>
                <Link
                  href={getReadingHref(currentPeriodReading.id)}
                  className="mt-3 inline-flex text-sm font-semibold text-primary"
                >
                  View reading
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="text-sm font-semibold text-foreground">
                  Meter reading pending
                </p>
                <Link
                  href={getCaretakerMeterEntryHref(unit.id, period)}
                  className="mt-2 inline-flex text-sm font-semibold text-primary"
                >
                  Enter reading for {period}
                </Link>
              </div>
            )}

            {unit.waterBills.length > 0 ? (
              <div className="space-y-3">
                {unit.waterBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="rounded-2xl border border-border bg-muted/10 p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {bill.period} · {formatCurrency(bill.total)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {bill.status.replaceAll("_", " ")} · Due{" "}
                      {formatDate(bill.dueDate)}
                    </p>
                    <Link
                      href={getBillHref(bill.id)}
                      className="mt-2 inline-flex text-sm font-semibold text-primary"
                    >
                      Open bill
                    </Link>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className={panelShellClassName}>
        <SectionIntro eyebrow="Maintenance" title="Recent issues" />
        <div className={`space-y-3 ${panelBodyClassName} pt-0`}>
          {unit.issues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
              No issues recorded for this unit yet.
            </div>
          ) : (
            unit.issues.map((issue) => (
              <div
                key={issue.id}
                className="rounded-2xl border border-border bg-muted/10 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClass(
                      issue.status,
                    )}`}
                  >
                    {issue.status.replaceAll("_", " ")}
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityClass(
                      issue.priority,
                    )}`}
                  >
                    {issue.priority}
                  </span>
                  <IssueSlaBadge
                    createdAt={issue.createdAt}
                    priority={issue.priority}
                    status={issue.status}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {issue.title}
                </p>
                <Link
                  href={getCaretakerIssueHref(issue.id)}
                  className="mt-2 inline-flex text-sm font-semibold text-primary"
                >
                  View issue
                </Link>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}