import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { SidebarNavItem } from "@/components/layout/org-sidebar-parts";
import { SIDEBAR_LINKS } from "@/components/layout/org-sidebar-links";
import { TENANT_SIDEBAR_LINKS } from "@/components/layout/tenant-sidebar-links";
import { adminNavItems, developerNavItems } from "@/app/(app)/platform/_lib/nav";
import { CARETAKER_NAV_ITEMS, caretakerLabel } from "@/app/(app)/dashboard/caretaker/_lib/i18n";
import { workspaceIconFor } from "@/components/shared/workspace-icon";
import { TenantDashboardQuickActions } from "@/app/(app)/dashboard/tenant/_components/tenant-dashboard-quick-actions";
import { RoleSelect } from "@/features/staff/components/_components/role-select";
import type { StaffRole } from "@/features/staff/constants/role-meta";
import { WizardStepNav } from "@/features/properties/components/_components/wizard-step-nav";
import { WorkspaceActions } from "@/components/shared/workspace-actions";
const groups = [
  { title: "Organisation", items: SIDEBAR_LINKS.filter(item => ["Properties", "Tenants", "Payments", "Inspections", "Staff", "Settings"].includes(item.label)) },
  { title: "Tenant", items: TENANT_SIDEBAR_LINKS.filter(item => ["Profile", "Lease", "Invoices", "Notifications", "Notices", "Documents"].includes(item.label)) },
  { title: "Platform", items: [...adminNavItems, ...developerNavItems].filter(item => ["Platform Admins", "Permissions", "Messages", "Reports", "API Keys", "System Health"].includes(item.label)).filter((item,index,all) => all.findIndex(other=>other.href===item.href)===index) },
  { title: "Caretaker", items: CARETAKER_NAV_ITEMS.filter(item => ["navToday", "navIssues", "navWaterBills", "navHandover", "navVendors", "navMoveOuts"].includes(item.labelKey)).map(item => ({href:item.href,label:caretakerLabel("en",item.labelKey)})) },
];
function Fixture() {
  const [role, setRole] = useState<StaffRole>("MANAGER");
  return <main className="estate-workspace mx-auto max-w-7xl space-y-6 p-3 sm:p-6">
    <h1 className="text-2xl font-semibold">Workspace navigation and actions</h1>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{groups.map(group => <nav key={group.title} aria-label={group.title} className="rounded-2xl border border-border bg-card p-3"><h2 className="mb-2 px-3 text-sm font-semibold">{group.title}</h2>{group.items.map(item => <SidebarNavItem key={item.href} item={{...item,icon:workspaceIconFor(item.href),roles:["ADMIN"]}} pathname="/dashboard/org/payments" mobile />)}</nav>)}</div>
    <WorkspaceActions role="ADMIN" />
    <TenantDashboardQuickActions />
    <section className="rounded-2xl border border-border bg-card p-4"><RoleSelect selectedRole={role} onChange={setRole} /></section>
    <section className="overflow-hidden rounded-2xl border border-border bg-card"><WizardStepNav currentStep={3} /></section>
  </main>;
}
createRoot(document.getElementById("fixture")!).render(<Fixture />);
