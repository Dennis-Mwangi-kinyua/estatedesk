import React from "react";
import { createRoot } from "react-dom/client";
import { StaffHeader } from "@/app/(app)/staff/_components/staff-header";
import { StaffDirectorySection } from "@/app/(app)/staff/_components/staff-directory-section";
const roles = ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER"] as const;
const data = {
  totalStaff: 25, onlineStaffUsers: 3, roleCounts: Object.fromEntries(roles.map(role => [role, 5])), page: 1, pageSize: 20, now: new Date("2026-10-10T12:00:00Z"),
  rows: roles.map((role, index) => ({ id: `member-${index}`, role, isOnline: index === 0, lastSeenAt: new Date("2026-10-10T11:55:00Z"), user: { fullName: index === 0 ? "Jane Wanjiku Mwangi Kinyua Long Family Name" : `Team member ${index}`, email: index === 0 ? "averylongstaffemailaddresswithoutspaces@organisation.example.test" : "staff@example.test", phone: "0712345678", status: "ACTIVE" } })),
} as unknown as React.ComponentProps<typeof StaffDirectorySection>["data"];
createRoot(document.getElementById("fixture")!).render(<main className="org-theme-content mx-auto min-w-0 max-w-7xl space-y-4 p-3 sm:p-6"><StaffHeader data={data} orgRole="ADMIN" /><StaffDirectorySection data={data} /></main>);
