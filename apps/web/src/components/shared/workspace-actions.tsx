"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

type WorkspaceAction = { label: string; description: string; href: string };

function actionsForWorkspace(path: string, role?: string): WorkspaceAction[] {
  if (path === "/platform/organizations") return [
    { label: "Create organisation", description: "Set up a workspace and owner login", href: "/platform/organizations/new" },
    { label: "Review onboarding", description: "Follow up on account requests", href: "/platform/onboarding" },
    { label: "Find an organisation", description: "Search platform records", href: "/platform/search" },
  ];
  if (path === "/dashboard/org") {
    if (role === "ACCOUNTANT") return [
      { label: "Review payments", description: "Verify and reconcile collections", href: "/dashboard/org/payments" },
      { label: "Review accounting requests", description: "Process pending finance work", href: "/dashboard/org/accounting/requests" },
      { label: "Open financial reports", description: "Check portfolio performance", href: "/dashboard/org/accounting/reports" },
    ];
    return [
      { label: "Add property", description: "Set up a property and its units", href: "/dashboard/org/properties/new" },
      { label: "Add tenant", description: "Start tenant onboarding", href: "/dashboard/org/tenants/new" },
      { label: "Review payments", description: "Check collections and pending payments", href: "/dashboard/org/payments" },
    ];
  }
  if (path === "/dashboard/tenant") return [
    { label: "Make a payment", description: "Pay rent or an outstanding bill", href: "/dashboard/tenant/payments/new" },
    { label: "Report an issue", description: "Request maintenance or assistance", href: "/dashboard/tenant/issues/report" },
    { label: "View invoices", description: "Check charges and balances", href: "/dashboard/tenant/invoice" },
  ];
  if (path === "/dashboard/caretaker") return [
    { label: "Open today’s tasks", description: "Work through assigned activities", href: "/dashboard/caretaker/today" },
    { label: "Report an issue", description: "Log a property maintenance request", href: "/dashboard/caretaker/issues/new" },
    { label: "Record water readings", description: "Update readings for assigned units", href: "/dashboard/caretaker/water-bills/read" },
  ];
  if (path === "/dashboard/landlord") return [
    { label: "Review statements", description: "Check income and property expenses", href: "/dashboard/landlord/statements" },
    { label: "Review payouts", description: "Track funds paid to you", href: "/dashboard/landlord/payouts" },
  ];
  return [];
}

export function WorkspaceActions({ role }: { role?: string }) {
  const actions = actionsForWorkspace(usePathname(), role);
  if (!actions.length) return null;
  return <section aria-label="Quick actions" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {actions.map(action => <Link key={action.href} href={action.href} className="group flex min-h-20 items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-primary">
      <div className="min-w-0"><span className="block text-sm font-semibold text-foreground">{action.label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{action.description}</span></div>
      <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
    </Link>)}
  </section>;
}
