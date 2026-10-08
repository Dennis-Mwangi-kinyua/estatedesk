"use client";

import { WorkspaceActions } from "@/components/shared/workspace-actions";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { reportClientError } from "@/lib/errors/report-client-error";
import type { OrgRole } from "@prisma/client";
import { getLiveOrgDashboardSummaryAction } from "@/features/dashboard/actions/get-live-org-dashboard-summary-action";
import { getLiveVacancyInquiryAlertsAction } from "@/features/dashboard/actions/get-live-vacancy-inquiry-alerts-action";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { VacancyInquiryAlert } from "@/features/dashboard/components/vacancy-inquiry-alert";
import type { VacancyInquiryAlert as VacancyInquiryAlertItem } from "@/features/dashboard/server/get-vacancy-inquiry-alerts";
import { OrgDashboardActivity } from "./org-dashboard-activity";
import { OrgDashboardGuidance } from "./org-dashboard-guidance";
import { OrgDashboardHeader } from "./org-dashboard-header";
import { OrgDashboardRolePanel } from "./org-dashboard-role-panel";
import { OrgDashboardSnapshot } from "./org-dashboard-snapshot";
import { OrgDashboardStats } from "./org-dashboard-stats";
import {
  getPollingIntervalMs,
  isBackgroundRefreshEnabled,
} from "@/lib/dev/background-refresh";

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

export function OrgDashboardWorkspace({
  initialData,
  initialVacancyInquiries,
  organizationName,
  orgId,
  orgRole,
  interval = 30_000,
}: {
  initialData: OrgDashboardSummary;
  initialVacancyInquiries: VacancyInquiryAlertItem[];
  organizationName: string;
  orgId: string;
  orgRole?: OrgRole | null;
  interval?: number;
}) {
  const [data, setData] = useState(initialData);
  const [vacancyInquiries, setVacancyInquiries] = useState(
    initialVacancyInquiries,
  );
  const refreshingRef = useRef(false);
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    if (!isBackgroundRefreshEnabled()) {
      return;
    }

    const pollingIntervalMs = getPollingIntervalMs(interval);
    if (pollingIntervalMs <= 0) {
      return;
    }

    let cancelled = false;

    const refreshData = async () => {
      if (refreshingRef.current) return;
      if (document.visibilityState !== "visible") return;
      if (!window.navigator.onLine) return;

      const now = Date.now();
      const effectiveInterval = (window.navigator as NavigatorWithConnection)
        .connection?.saveData
        ? Math.max(pollingIntervalMs, 60_000)
        : pollingIntervalMs;

      if (now - lastRefreshAtRef.current < effectiveInterval) return;

      refreshingRef.current = true;

      try {
        const [nextData, nextVacancyInquiries] = await Promise.all([
          getLiveOrgDashboardSummaryAction(),
          getLiveVacancyInquiryAlertsAction(),
        ]);

        if (!cancelled) {
          setData(nextData);
          setVacancyInquiries(nextVacancyInquiries);
          lastRefreshAtRef.current = Date.now();
        }
      } catch {
        reportClientError({ context: "org-dashboard-refresh" });
      } finally {
        refreshingRef.current = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshData();
    }, pollingIntervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleVisibilityChange);
    };
  }, [interval]);

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-5 pb-12 sm:space-y-6">
      <VacancyInquiryAlert inquiries={vacancyInquiries} orgId={orgId} />
      <OrgDashboardHeader
        data={data}
        organizationName={organizationName}
        orgRole={orgRole}
      />
      {(orgRole === "ADMIN" || orgRole === "MANAGER") && (data.totalProperties === 0 || data.totalUnits === 0 || data.totalTenants === 0 || data.activeLeases === 0 || data.totalPayments === 0) && <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="setup-progress-title">
        <h2 id="setup-progress-title" className="font-semibold">Finish setting up your organisation</h2>
        <p className="mt-1 text-sm text-muted-foreground">Complete these steps to start managing your portfolio.</p>
        <ol className="mt-3 flex flex-wrap gap-3">{[
          { label: "Properties", done: data.totalProperties > 0, href: "/dashboard/org/properties" },
          { label: "Units", done: data.totalUnits > 0, href: "/dashboard/org/units" },
          { label: "Tenants", done: data.totalTenants > 0, href: "/dashboard/org/tenants" },
          { label: "Leases", done: data.activeLeases > 0, href: "/dashboard/org/leases" },
          { label: "Payments", done: data.totalPayments > 0, href: "/dashboard/org/payments" },
        ].map(item => <li key={item.href}><Link className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm" href={item.href}><span aria-hidden="true">{item.done ? "✓" : "○"}</span>{item.label}<span className="sr-only">{item.done ? ": completed" : ": needs setup"}</span></Link></li>)}</ol>
        {orgRole === "ADMIN" && <Link className="mt-3 inline-block text-sm text-primary underline" href="/dashboard/org/settings">Configure billing and payment collection</Link>}
      </section>}
      <WorkspaceActions role={orgRole ?? undefined} />
      <OrgDashboardStats data={data} />
      <OrgDashboardRolePanel data={data} orgRole={orgRole} />

      {/* Operations full-width on mobile; side rail only on large screens */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <div className="min-w-0 space-y-5">
          <OrgDashboardSnapshot data={data} />
          <OrgDashboardActivity data={data} />
        </div>
        <div className="min-w-0 xl:sticky xl:top-24">
          <OrgDashboardGuidance data={data} orgRole={orgRole} />
        </div>
      </div>
    </div>
  );
}
