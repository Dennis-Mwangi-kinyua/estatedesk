"use client";


import { useEffect, useRef, useState, type ReactNode } from "react";
import { reportClientError } from "@/lib/errors/report-client-error";
import type { OrgRole } from "@prisma/client";
import { getLiveOrgDashboardSummaryAction } from "@/features/dashboard/actions/get-live-org-dashboard-summary-action";
import { getLiveVacancyInquiryAlertsAction } from "@/features/dashboard/actions/get-live-vacancy-inquiry-alerts-action";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { VacancyInquiryAlert } from "@/features/dashboard/components/vacancy-inquiry-alert";
import type { VacancyInquiryAlert as VacancyInquiryAlertItem } from "@/features/dashboard/server/get-vacancy-inquiry-alerts";
import { OrgDashboardHeader } from "./org-dashboard-header";
import { OrgDashboardSnapshot } from "./org-dashboard-snapshot";
import { OrgDashboardStats } from "./org-dashboard-stats";
import { OrgFeatureGrid } from "./org-feature-grid";
import type { MobileWorkspaceLink } from "@estatedesk/contracts/mobile";
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
  featureLinks = [],
  workflow = null,
  metrics = null,
}: {
  initialData: OrgDashboardSummary;
  initialVacancyInquiries: VacancyInquiryAlertItem[];
  organizationName: string;
  orgId: string;
  orgRole?: OrgRole | null;
  interval?: number;
  featureLinks?: MobileWorkspaceLink[];
  workflow?: ReactNode;
  metrics?: ReactNode;
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
        organizationName={organizationName}
        orgRole={orgRole}
      />
      {workflow}
      {metrics}
      <OrgDashboardStats data={data} />
      <div className="min-w-0 space-y-5">
        <OrgDashboardSnapshot data={data} />
      </div>
      <OrgFeatureGrid features={featureLinks} />
    </div>
  );
}
