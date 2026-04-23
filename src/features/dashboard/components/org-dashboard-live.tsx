"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { getLiveOrgDashboardSummaryAction } from "@/features/dashboard/actions/get-live-org-dashboard-summary-action";
import { OrgDashboardHero } from "@/features/dashboard/components/org-dashboard-hero";
import { OrgDashboardMetrics } from "@/features/dashboard/components/org-dashboard-metrics";

const OrgDashboardPortfolio = dynamic(
  () =>
    import("@/features/dashboard/components/org-dashboard-portfolio").then(
      (m) => m.OrgDashboardPortfolio,
    ),
  {
    loading: () => (
      <div className="h-80 animate-pulse rounded-3xl border border-neutral-200 bg-white" />
    ),
  },
);

const OrgDashboardPayments = dynamic(
  () =>
    import("@/features/dashboard/components/org-dashboard-payments").then(
      (m) => m.OrgDashboardPayments,
    ),
  {
    loading: () => (
      <div className="h-72 animate-pulse rounded-3xl border border-neutral-200 bg-white" />
    ),
  },
);

const OrgDashboardSidebar = dynamic(
  () =>
    import("@/features/dashboard/components/org-dashboard-sidebar").then(
      (m) => m.OrgDashboardSidebar,
    ),
  {
    loading: () => (
      <div className="h-[38rem] animate-pulse rounded-3xl border border-neutral-200 bg-white" />
    ),
  },
);

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

export function OrgDashboardLive({
  initialData,
  membership,
  interval = 5000,
}: {
  initialData: OrgDashboardSummary;
  membership: Membership;
  interval?: number;
}) {
  const [data, setData] = useState(initialData);
  const refreshingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const refreshData = async () => {
      if (refreshingRef.current) return;
      if (document.visibilityState !== "visible") return;

      refreshingRef.current = true;

      try {
        const nextData = await getLiveOrgDashboardSummaryAction();

        if (!cancelled) {
          setData(nextData);
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

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [interval]);

  return (
    <div className="space-y-6">
      <OrgDashboardHero data={data} />
      <OrgDashboardMetrics data={data} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <OrgDashboardPortfolio data={data} />
          <OrgDashboardPayments data={data} />
        </div>

        <div className="xl:col-span-4">
          <OrgDashboardSidebar data={data} membership={membership} />
        </div>
      </section>
    </div>
  );
}