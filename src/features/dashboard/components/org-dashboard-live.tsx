"use client";

import { useEffect, useRef, useState } from "react";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { getLiveOrgDashboardSummaryAction } from "@/features/dashboard/actions/get-live-org-dashboard-summary-action";
import { OrgDashboardHero } from "@/features/dashboard/components/org-dashboard-hero";
import { OrgDashboardMetrics } from "@/features/dashboard/components/org-dashboard-metrics";
import { VacancyInquiryAlert } from "@/features/dashboard/components/vacancy-inquiry-alert";
import type { VacancyInquiryAlert as VacancyInquiryAlertItem } from "@/features/dashboard/server/get-vacancy-inquiry-alerts";

type Membership = {
  orgId: string;
  role: string;
  org: {
    id: string;
    name: string;
    slug: string;
    currencyCode: string;
    timezone: string;
  };
};

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

export function OrgDashboardLive({
  initialData,
  initialVacancyInquiries,
  membership,
  interval = 30_000,
}: {
  initialData: OrgDashboardSummary;
  initialVacancyInquiries: VacancyInquiryAlertItem[];
  membership: Membership;
  interval?: number;
}) {
  const [data, setData] = useState(initialData);
  const refreshingRef = useRef(false);
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const refreshData = async () => {
      if (refreshingRef.current) return;
      if (document.visibilityState !== "visible") return;
      if (!window.navigator.onLine) return;

      const now = Date.now();
      const effectiveInterval = (window.navigator as NavigatorWithConnection)
        .connection?.saveData
        ? Math.max(interval, 60_000)
        : interval;

      if (now - lastRefreshAtRef.current < effectiveInterval) return;

      refreshingRef.current = true;

      try {
        const nextData = await getLiveOrgDashboardSummaryAction();

        if (!cancelled) {
          setData(nextData);
          lastRefreshAtRef.current = Date.now();
        }
      } catch (error) {
        console.error("Failed to silently refresh dashboard", error);
      } finally {
        refreshingRef.current = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshData();
    }, interval);

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
    <div className="space-y-6">
      <VacancyInquiryAlert
        inquiries={initialVacancyInquiries}
        orgId={membership.orgId}
      />
      <OrgDashboardHero data={data} organizationName={membership.org.name} />
      <OrgDashboardMetrics data={data} />
    </div>
  );
}
