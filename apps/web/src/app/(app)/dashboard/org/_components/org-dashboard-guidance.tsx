import Link from "next/link";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import {
  DASHBOARD_GUIDANCE,
  DASHBOARD_QUICK_LINKS,
} from "../_lib/constants";
import { panelShellClassName, QuickLinkCard } from "./org-dashboard-ui";

export function OrgDashboardGuidance({
  data,
  orgRole,
}: {
  data: OrgDashboardSummary;
  orgRole?: OrgRole | null;
}) {
const setup = [
    { title: "Add your first property", done: data.totalProperties > 0, href: "/dashboard/org/properties" },
    { title: "Add units", done: data.totalUnits > 0, href: "/dashboard/org/units" },
    { title: "Add staff", done: data.totalEmployees > 1, href: "/dashboard/org/staff" },
    { title: "Add tenants", done: data.totalTenants > 0, href: "/dashboard/org/tenants" },
    { title: "Create a lease", done: data.activeLeases > 0, href: "/dashboard/org/leases" },
    { title: "Record your first payment", done: data.totalPayments > 0, href: "/dashboard/org/payments" },
  ].filter(item => orgRole === "ADMIN" || item.href !== "/dashboard/org/staff");
  const complete = setup.filter(item => item.done).length;
  return (
    <WorkspaceGuidePanel
      title="Portfolio signals"
      description="Quick health checks before diving into individual workspaces."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Portfolio signals</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Quick health checks before diving into individual workspaces.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Open issues
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {data.openIssues}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.urgentIssues} urgent
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Unread notifications
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {data.unreadNotifications}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Finance queue
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {data.pendingFinanceRequests}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Request tickets</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Vacancy leads
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {data.vacancyInquiries}
            </p>
          </div>
        </div>
      </section>

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Getting started</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {complete} of {setup.length} setup steps completed.
        </p>

        <div className="mt-4 space-y-3">
          {setup.map((item, index) => (
            <div
              key={item.href}
              className="rounded-2xl border border-border bg-muted/10 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {item.done ? "✓" : index + 1}
                </span>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.done ? "Completed" : "Next setup step"}
              </p>
              <Link className="mt-2 inline-block text-sm font-medium text-primary underline" href={item.href}>{item.done ? "View" : "Start"}</Link>
            </div>
          ))}
        </div>
      </section>

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Recommended next steps</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Common workflows to keep portfolio setup, billing, and collections moving.
        </p>

        <div className="mt-4 space-y-3">
          {DASHBOARD_GUIDANCE.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-muted/10 p-3"
            >
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="mt-3 inline-flex text-sm font-medium text-primary transition hover:text-primary/80"
              >
                {item.actionLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Quick links</h2>
        <div className="mt-4 space-y-3">
          {DASHBOARD_QUICK_LINKS.map((item) => (
            <QuickLinkCard
              key={item.title}
              href={item.href}
              title={item.title}
              description={item.description}
              icon={item.icon}
            />
          ))}
        </div>
      </section>

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Portfolio setup guide</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Learn how properties, units, tenants, and collections stay aligned.
        </p>
        <div className="mt-4">
          <InAppGuideLink
            topic="portfolio"
            workspace="org"
            orgRole={orgRole}
            variant="card"
            className="w-full justify-center"
          />
        </div>
      </section>
    </WorkspaceGuidePanel>
  );
}