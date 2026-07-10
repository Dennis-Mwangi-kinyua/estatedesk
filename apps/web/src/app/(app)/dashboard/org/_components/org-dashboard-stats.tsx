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
    <section className="space-y-3">
      <div className="px-0.5">
        <h2 className="text-sm font-semibold text-foreground sm:text-base">
          Portfolio at a glance
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Units, people, and live activity across this organization.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
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
          note={`${data.apartmentMix}% of unit stock`}
          icon={Building}
          href="/dashboard/org/units"
        />
        <StatCard
          label="Online Now"
          value={data.onlineUsers}
          note="Active users in org"
          icon={Wifi}
          highlight={data.onlineUsers > 0 ? "success" : "default"}
          href="/dashboard/org/notifications"
        />
        <StatCard
          label="Caretakers"
          value={data.totalCaretakers}
          note={`${data.activeCaretakerAssignments} assignments`}
          icon={UserCog}
          href="/dashboard/org/staff"
        />
        <StatCard
          label="Active Tenants"
          value={data.activeTenants}
          note={`${data.totalTenants} total records`}
          icon={Users}
          highlight={data.activeTenants > 0 ? "success" : "default"}
          href="/dashboard/org/tenants"
        />
        <StatCard
          label="Employees"
          value={data.totalEmployees}
          note="Office & admin staff"
          icon={Briefcase}
          href="/dashboard/org/staff"
        />
        <StatCard
          label="Active Leases"
          value={data.activeLeases}
          note="Signed coverage"
          icon={FileText}
          highlight={data.activeLeases > 0 ? "success" : "default"}
          href="/dashboard/org/leases"
        />
      </div>
    </section>
  );
}
