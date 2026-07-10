"use client";

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
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-5 px-4 pb-28 pt-4 sm:space-y-6 sm:px-6 lg:px-8">
      <VacancyInquiryAlert inquiries={vacancyInquiries} orgId={orgId} />
      <OrgDashboardHeader
        data={data}
        organizationName={organizationName}
        orgRole={orgRole}
      />
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
