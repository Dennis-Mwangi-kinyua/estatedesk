import { createRoot } from "react-dom/client";
import { useState } from "react";
import { OrgDetailActivitySection } from "@/app/(app)/platform/organizations/[slug]/_components/org-detail-activity-section";
import type { OrgDetailWorkspaceProps } from "@/app/(app)/platform/organizations/[slug]/_components/org-detail-workspace";
function Fixture() {
  const [locked, setLocked] = useState(false);
  const data = { org: { id: "fixture-org", name: "Greenview", slug: "greenview", status: locked ? "DISABLED" : "ACTIVE", blacklistedAt: locked ? new Date("2026-11-10T10:00:00Z") : null, blacklistReason: locked ? "Confirmed policy breach" : null }, recentPayments: [], recentMembers: [], recentAuditLogs: [], statusParams: {} } as unknown as OrgDetailWorkspaceProps;
  return <><button onClick={() => setLocked(value => !value)}>Toggle fixture lock</button><OrgDetailActivitySection {...data} /></>;
}
createRoot(document.getElementById("fixture")!).render(<Fixture />);
