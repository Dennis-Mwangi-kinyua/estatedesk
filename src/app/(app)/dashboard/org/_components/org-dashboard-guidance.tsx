import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import {
  DASHBOARD_GUIDANCE,
  DASHBOARD_QUICK_LINKS,
  DASHBOARD_WORKFLOW_STEPS,
} from "../_lib/constants";
import { panelShellClassName, QuickLinkCard } from "./org-dashboard-ui";

export function OrgDashboardGuidance({
  data,
  orgRole,
}: {
  data: OrgDashboardSummary;
  orgRole?: OrgRole | null;
}) {
  return (
    <aside className="space-y-4">
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
          Core setup workflow for new portfolio managers.
        </p>

        <div className="mt-4 space-y-3">
          {DASHBOARD_WORKFLOW_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-border bg-muted/10 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {item.step}
                </span>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
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
    </aside>
  );
}