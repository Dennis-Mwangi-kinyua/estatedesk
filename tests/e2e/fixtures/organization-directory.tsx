import React from "react";
import { createRoot } from "react-dom/client";
import { OrganizationWorkspaceCard } from "@/app/(app)/platform/_components/organization-workspace-card";
import { PlatformDashboardAlert } from "@/app/(app)/platform/_components/platform-dashboard-alert";
createRoot(document.getElementById("fixture")!).render(<main className="p-4"><PlatformDashboardAlert newOnboardingCount={3} recentOnboardingRequests={[]} /><div className="organization-directory-grid mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({length:16}, (_,i)=><OrganizationWorkspaceCard key={i} layout="directory" href={`/platform/organizations/org-${i}`} name={`Organization ${i+1}`} slug={`org-${i}`} status="ACTIVE" createdAt={new Date("2026-10-01")} metrics={{properties:3,tenants:24,leases:20,staff:4}} />)}</div></main>);
