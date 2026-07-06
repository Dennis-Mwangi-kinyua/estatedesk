import Link from "next/link";
import { DeferredLink } from "@/components/navigation/app-links";
import {
  getCaretakerUnitHref,
} from "@/app/(app)/dashboard/caretaker/_lib/paths";
import {
  getPriorityClass,
  getStatusClass,
} from "@/app/(app)/dashboard/caretaker/issues/_lib/helpers";
import {
  MiniMetric,
  panelBodyClassName,
  panelShellClassName,
  QuickLinkCard,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { Building2, FileText, Wrench } from "lucide-react";
import {
  formatCurrency,
  formatDate,
} from "../_lib/helpers";
import type { CaretakerTenantDetailPageData } from "../_lib/types";

export function TenantDetailSections({
  data,
}: {
  data: Extract<CaretakerTenantDetailPageData, { ok: true }>;
}) {
  const { tenant, activeLease, issues, openIssues } = data;

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniMetric label="Open issues" value={String(openIssues)} />
        <MiniMetric
          label="Leases in scope"
          value={String(tenant.leases.length)}
        />
        <MiniMetric
          label="Tenant type"
          value={tenant.type.replaceAll("_", " ").toLowerCase()}
        />
      </section>

      {activeLease ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <QuickLinkCard
            href={getCaretakerUnitHref(activeLease.unit.id)}
            title="Unit profile"
            description={`House ${activeLease.unit.houseNo} operations view.`}
            icon={Building2}
          />
          <QuickLinkCard
            href="/dashboard/caretaker/leases"
            title="Lease records"
            description="Review lease status and dates."
            icon={FileText}
          />
          <QuickLinkCard
            href="/dashboard/caretaker/issues"
            title="Issues queue"
            description="Open maintenance linked to this tenant."
            icon={Wrench}
          />
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={panelShellClassName}>
          <SectionIntro eyebrow="Contact" title="Tenant details" />
          <div className={`space-y-4 ${panelBodyClassName} pt-0`}>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-muted/10 p-4">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {tenant.phone}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/10 p-4">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {tenant.email ?? "—"}
                </p>
              </div>
            </div>

            {tenant.nationalId ? (
              <div className="rounded-2xl border border-border bg-muted/10 p-4">
                <p className="text-xs text-muted-foreground">National ID</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {tenant.nationalId}
                </p>
              </div>
            ) : null}

            {tenant.nextOfKin ? (
              <div className="rounded-2xl border border-border bg-muted/10 p-4">
                <p className="text-sm text-muted-foreground">Next of kin</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {tenant.nextOfKin.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tenant.nextOfKin.relationship} · {tenant.nextOfKin.phone}
                </p>
              </div>
            ) : null}

            {tenant.notes ? (
              <div className="rounded-2xl border border-border bg-muted/10 p-4">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm text-foreground">{tenant.notes}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className={panelShellClassName}>
          <SectionIntro eyebrow="Lease" title="Assigned units" />
          <div className={`space-y-3 ${panelBodyClassName} pt-0`}>
            {tenant.leases.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
                No leases in your assigned units.
              </div>
            ) : (
              tenant.leases.map((lease) => (
                <div
                  key={lease.id}
                  className="rounded-2xl border border-border bg-muted/10 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold capitalize">
                      {lease.status.toLowerCase()}
                    </span>
                    <DeferredLink
                      href={getCaretakerUnitHref(lease.unit.id)}
                      className="text-sm font-semibold text-primary"
                    >
                      House {lease.unit.houseNo}
                    </DeferredLink>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {lease.unit.property.name}
                    {lease.unit.building?.name
                      ? ` · ${lease.unit.building.name}`
                      : ""}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Start</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {formatDate(lease.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {formatDate(lease.endDate)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {formatCurrency(lease.monthlyRent ?? lease.unit.rentAmount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className={panelShellClassName}>
        <SectionIntro eyebrow="Maintenance" title="Related issues" />
        <div className={`space-y-3 ${panelBodyClassName} pt-0`}>
          {issues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
              No issues linked to this tenant&apos;s units yet.
            </div>
          ) : (
            issues.map((issue) => (
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
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {issue.title}
                </p>
                {issue.unit ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {issue.unit.property.name} · House {issue.unit.houseNo}
                  </p>
                ) : null}
                <Link
                  href={`/dashboard/caretaker/issues?status=${issue.status}`}
                  className="mt-2 inline-flex text-sm font-semibold text-primary"
                >
                  Open issues queue
                </Link>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}