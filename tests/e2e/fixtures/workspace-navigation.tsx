import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { WorkspaceAccessProvider } from "@/components/navigation/workspace-link";
import { OrgDashboardSidebar } from "@/components/layout/org-dashboard-sidebar";
import { OrgMobileNav } from "@/components/layout/org-mobile-nav";
import { TenantDashboardSidebar } from "@/components/layout/tenant-dashboard-sidebar";
import { CaretakerNavigation } from "@/components/layout/caretaker-navigation";
import { PlatformNavigation } from "@/app/(app)/platform/_components/platform-navigation";
import { getNavItemsForMode } from "@/app/(app)/platform/_lib/nav";

type Role = "ADMIN" | "OFFICE" | "ACCOUNTANT" | "SECURITY" | "TENANT" | "CARETAKER" | "PLATFORM_ADMIN";
const paths: Record<Role, string> = {
  ADMIN: "/dashboard/org/issues/resolution-reports",
  OFFICE: "/dashboard/org/tenants",
  ACCOUNTANT: "/dashboard/org/accounting/requests",
  SECURITY: "/dashboard/gate",
  TENANT: "/dashboard/tenant",
  CARETAKER: "/dashboard/caretaker/today",
  PLATFORM_ADMIN: "/platform/developer/docs",
};
function Fixture() {
  const [role, setRole] = useState<Role>("ACCOUNTANT");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeLease, setActiveLease] = useState(true);
  (window as Window & { __navigationPath?: string }).__navigationPath = paths[role];
  const access = {
    platformRole: role === "PLATFORM_ADMIN" ? "PLATFORM_ADMIN" as const : "USER" as const,
    activeOrgId: "org", activeOrgRole: role === "PLATFORM_ADMIN" ? null : role,
    caretakerSections: ["", "today", "notifications", "profile", "security", "help", "broadcasts"],
  };
  return <WorkspaceAccessProvider access={access}>
    <div className="fixed right-2 top-2 z-[200] flex max-w-[calc(100vw-1rem)] flex-wrap gap-2 rounded-lg bg-card p-2">
      <select aria-label="Fixture role" value={role} onChange={event => { setRole(event.target.value as Role); setOpen(false); }}>
        {Object.keys(paths).map(value => <option key={value}>{value}</option>)}
      </select>
      <button onClick={() => setOpen(true)}>Open navigation</button>
      <button onClick={() => setActiveLease(value => !value)}>Toggle lease</button>
    </div>
    {role === "TENANT" ? <TenantDashboardSidebar organizationName="Greenview" hasActiveLease={activeLease} hasVisitorAccess mobileOpen={open} setMobileOpen={setOpen} />
      : role === "CARETAKER" ? <div className="max-w-72 pt-20"><CaretakerNavigation /></div>
      : role === "PLATFORM_ADMIN" ? <div className="max-w-72 pt-20"><input aria-label="Filter tools" value={query} onChange={event => setQuery(event.target.value)} /><nav aria-label="Developer navigation"><PlatformNavigation items={getNavItemsForMode("developer", { isSuperAdmin: false })} mode="developer" query={query} /></nav></div>
      : <><OrgDashboardSidebar organizationName="Greenview" role={role} mobileOpen={open} setMobileOpen={setOpen} /><OrgMobileNav role={role} menuOpen={open} onMenuClick={() => setOpen(true)} /></>}
  </WorkspaceAccessProvider>;
}
createRoot(document.getElementById("fixture")!).render(<Fixture />);
