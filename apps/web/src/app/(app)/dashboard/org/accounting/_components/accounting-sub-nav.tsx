"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  CalendarRange,
  ChartPie,
  FileSpreadsheet,
  Inbox,
  Landmark,
  LayoutDashboard,
  Scale,
  Settings2,
  Wallet,
} from "lucide-react";

const LINKS = [
  {
    href: "/dashboard/org/accounting",
    label: "Overview",
    short: "Home",
    exact: true,
    Icon: LayoutDashboard,
  },
  {
    href: "/dashboard/org/accounting/coa",
    label: "Chart of accounts",
    short: "COA",
    Icon: BookOpen,
  },
  {
    href: "/dashboard/org/accounting/journals",
    label: "Journals",
    short: "Journals",
    Icon: FileSpreadsheet,
  },
  {
    href: "/dashboard/org/accounting/periods",
    label: "Periods",
    short: "Periods",
    Icon: CalendarRange,
  },
  {
    href: "/dashboard/org/accounting/bank",
    label: "Bank recon",
    short: "Bank",
    Icon: Landmark,
  },
  {
    href: "/dashboard/org/accounting/budgets",
    label: "Budgets",
    short: "Budgets",
    Icon: Wallet,
  },
  {
    href: "/dashboard/org/accounting/distributions",
    label: "Distributions",
    short: "Payouts",
    Icon: Building2,
  },
  {
    href: "/dashboard/org/accounting/receivables",
    label: "Receivables",
    short: "AR",
    Icon: Scale,
  },
  {
    href: "/dashboard/org/accounting/reports",
    label: "Reports",
    short: "Reports",
    Icon: ChartPie,
  },
  {
    href: "/dashboard/org/accounting/requests",
    label: "Requests",
    short: "Inbox",
    Icon: Inbox,
  },
  {
    href: "/dashboard/org/accounting/settings",
    label: "Settings",
    short: "Settings",
    Icon: Settings2,
  },
] as const;

export function AccountingSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Accounting sections"
      className="-mx-4 border-b border-border bg-background/80 px-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-card sm:px-2 sm:py-2"
    >
      <div className="flex gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-none sm:pb-0 sm:pt-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LINKS.map((link) => {
          const active =
            "exact" in link && link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm"
                  : "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-muted/40"
              }
            >
              <link.Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
              <span className="sm:hidden">{link.short}</span>
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
