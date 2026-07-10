import {
  Briefcase,
  Building,
  FileText,
  Home,
  UserCog,
  Users,
  Wifi,
} from "lucide-react";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { StatCard } from "./org-dashboard-ui";

export function OrgDashboardStats({ data }: { data: OrgDashboardSummary }) {
  return (
    <section className="grid grid-cols-[repeat(auto-fit,minmax(11.75rem,1fr))] gap-3">
      <StatCard
        label="Total Units"
        value={data.totalUnits}
        note="All active rentable units"
        icon={Home}
        href="/dashboard/org/units"
      />
      <StatCard
        label="Apartments"
        value={data.totalApartments}
        note={`${data.apartmentMix}% of total unit stock`}
        icon={Building}
        href="/dashboard/org/units"
      />
      <StatCard
        label="Online Now"
        value={data.onlineUsers}
        note="Active users in this organization"
        icon={Wifi}
        highlight={data.onlineUsers > 0 ? "success" : "default"}
        href="/dashboard/org/notifications"
      />
      <StatCard
        label="Caretakers"
        value={data.totalCaretakers}
        note={`${data.activeCaretakerAssignments} active assignments`}
        icon={UserCog}
        href="/dashboard/org/staff"
      />
      <StatCard
        label="Active Tenants"
        value={data.activeTenants}
        note={`${data.totalTenants} total tenant records`}
        icon={Users}
        highlight={data.activeTenants > 0 ? "success" : "default"}
        href="/dashboard/org/tenants"
      />
      <StatCard
        label="Employees"
        value={data.totalEmployees}
        note="Admin, manager, office, and accountant staff"
        icon={Briefcase}
        href="/dashboard/org/staff"
      />
      <StatCard
        label="Active Leases"
        value={data.activeLeases}
        note="Current signed lease coverage"
        icon={FileText}
        highlight={data.activeLeases > 0 ? "success" : "default"}
        href="/dashboard/org/leases"
      />
    </section>
  );
}