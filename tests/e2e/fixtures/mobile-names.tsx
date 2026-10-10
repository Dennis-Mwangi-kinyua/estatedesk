import React from "react";
import { createRoot } from "react-dom/client";
import { TenantDashboardShell } from "@/components/layout/tenant-dashboard-shell";
import { OrgDashboardShell } from "@/components/layout/org-dashboard-shell";

const organizationName = "Greenview Riverside Apartments and Residences International Management Company " + "VeryLongApartmentNameWithoutSpaces".repeat(3);
const userName = "Jane Wanjiku Mwangi Kinyua Long Family Name " + "VeryLongFamilyName".repeat(3);
const Shell = new URLSearchParams(location.search).get("workspace") === "org" ? OrgDashboardShell : TenantDashboardShell;
createRoot(document.getElementById("fixture")!).render(
  <Shell organizationName={organizationName} userName={userName} hasActiveLease>
    <h2 data-content-start className="text-xl font-semibold">Your workspace content</h2>
    <p className="ed-full-name whitespace-normal break-words [overflow-wrap:anywhere]">{organizationName}</p>
    <div style={{ minHeight: 1600 }} />
    <button type="button" className="min-h-11 rounded-xl border px-4">Last page action</button>
  </Shell>,
);
