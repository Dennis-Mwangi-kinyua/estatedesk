import React from "react";
import { createRoot } from "react-dom/client";
import { OrgDashboardHeader } from "@/app/(app)/dashboard/org/_components/org-dashboard-header";
import { TenantDashboardHeader } from "@/app/(app)/dashboard/tenant/_components/tenant-dashboard-header";
import { CaretakerDashboardHeader } from "@/app/(app)/dashboard/caretaker/_components/caretaker-dashboard-header";
import { OverviewSection } from "@/app/(app)/dashboard/landlord/_components/overview-section";
const org = { occupancyRate: 85, vacantUnits: 3, pendingPayments: 2, openIssues: 1, urgentIssues: 1, pendingFinanceRequests: 0, waterPendingApproval: 0, expenditureApprovalsPending: 0 } as React.ComponentProps<typeof OrgDashboardHeader>["data"];
const caretaker = {assignedUnits: 20, openIssues: 2, urgentIssues: 1, pendingWaterBills: 1, scheduledInspections: 2, resolvedToday: 1, completedInspectionsToday: 1} as React.ComponentProps<typeof CaretakerDashboardHeader>["data"];
const landlord = {displayName: "Mary", collectionRate: 85, monthlyAmountPaid: 85000, monthlyAmountDue: 100000} as React.ComponentProps<typeof OverviewSection>["data"];
const portalContext = {paymentHealth: {tone: "settled", deficit: 0, paymentStatus: "Paid"}, pendingLeaseSignatures: []} as unknown as React.ComponentProps<typeof TenantDashboardHeader>["portalContext"];
createRoot(document.getElementById("fixture")!).render(<div className="space-y-6">
<section data-workspace="tenant"><TenantDashboardHeader fullName="Jane" organizationName="Greenview" propertyName="Palm Court" houseNo="A2" leaseStatus="ACTIVE" monthlyRent={25000} dueDay={5} openIssuesCount={1} unreadNotificationCount={2} portalContext={portalContext} /></section>
<section data-workspace="org"><OrgDashboardHeader data={org} organizationName="Greenview Properties" orgRole="AGENT" /></section>
<section data-workspace="caretaker"><CaretakerDashboardHeader data={caretaker} fullName="James Kamau" /></section>
<section data-workspace="landlord"><OverviewSection data={landlord} /></section>
</div>);
