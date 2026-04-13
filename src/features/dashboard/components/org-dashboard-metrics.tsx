import {
  Home,
  Building,
  Briefcase,
  UserCog,
  Users,
  FileText,
} from "lucide-react";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { MetricCard } from "./org-dashboard-shared";

export function OrgDashboardMetrics({
  data,
}: {
  data: OrgDashboardSummary;
}) {
  const topMetrics = [
    {
      title: "Total Units",
      value: data.totalUnits,
      subtitle: "All active rentable units",
      icon: Home,
      tint: "blue" as const,
    },
    {
      title: "Apartments",
      value: data.totalApartments,
      subtitle: `${data.apartmentMix}% of total unit stock`,
      icon: Building,
      tint: "neutral" as const,
    },
    {
      title: "Employees",
      value: data.totalEmployees,
      subtitle: "Admin, manager, office, and accountant staff",
      icon: Briefcase,
      tint: "green" as const,
    },
    {
      title: "Caretakers",
      value: data.totalCaretakers,
      subtitle: `${data.activeCaretakerAssignments} active assignments`,
      icon: UserCog,
      tint: "amber" as const,
    },
    {
      title: "Active Tenants",
      value: data.activeTenants,
      subtitle: `${data.totalTenants} total tenant records`,
      icon: Users,
      tint: "green" as const,
    },
    {
      title: "Active Leases",
      value: data.activeLeases,
      subtitle: "Current signed lease coverage",
      icon: FileText,
      tint: "neutral" as const,
    },
  ] as const;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {topMetrics.map((item) => (
        <MetricCard
          key={item.title}
          title={item.title}
          value={item.value}
          subtitle={item.subtitle}
          icon={item.icon}
          tint={item.tint}
        />
      ))}
    </section>
  );
}