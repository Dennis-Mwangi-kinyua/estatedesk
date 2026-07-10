"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard/org/accounting", label: "Overview", exact: true },
  { href: "/dashboard/org/accounting/coa", label: "Chart of accounts" },
  { href: "/dashboard/org/accounting/journals", label: "Journals" },
  { href: "/dashboard/org/accounting/periods", label: "Periods" },
  { href: "/dashboard/org/accounting/bank", label: "Bank recon" },
  { href: "/dashboard/org/accounting/budgets", label: "Budgets" },
  { href: "/dashboard/org/accounting/distributions", label: "Distributions" },
  { href: "/dashboard/org/accounting/receivables", label: "Receivables" },
  { href: "/dashboard/org/accounting/reports", label: "Reports" },
  { href: "/dashboard/org/accounting/requests", label: "Requests" },
  { href: "/dashboard/org/accounting/settings", label: "Settings" },
] as const;

export function AccountingSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
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
                ? "inline-flex h-9 items-center rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground"
                : "inline-flex h-9 items-center rounded-xl border border-border bg-background px-3.5 text-xs font-semibold text-foreground transition hover:bg-muted/30"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}