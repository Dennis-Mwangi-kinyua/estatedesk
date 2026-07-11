"use client";

import Link from "next/link";
import { BookMarked, Receipt, RefreshCw, Scale } from "lucide-react";
import { buildAccountingPageHref } from "../_lib/helpers";

/**
 * Sticky bottom action dock for phones — core bookkeeping within thumb reach.
 */
export function AccountingMobileDock() {
  const items = [
    {
      href: buildAccountingPageHref({ tab: "transactions", entry: "expense" }),
      label: "Expense",
      Icon: Receipt,
    },
    {
      href: buildAccountingPageHref({ tab: "transactions", entry: "journal" }),
      label: "Journal",
      Icon: BookMarked,
    },
    {
      href: buildAccountingPageHref({ tab: "operations" }),
      label: "Sync",
      Icon: RefreshCw,
    },
    {
      href: "/dashboard/org/accounting/reports",
      label: "Reports",
      Icon: Scale,
    },
  ] as const;

  return (
    <nav
      aria-label="Accounting quick dock"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        {items.map((item) => (
          <li key={item.href + item.label}>
            <Link
              href={item.href}
              className="flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold text-muted-foreground transition active:bg-muted hover:text-foreground"
            >
              <item.Icon className="h-5 w-5 text-primary" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
