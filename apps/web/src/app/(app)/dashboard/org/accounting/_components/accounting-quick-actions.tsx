import Link from "next/link";
import {
  ArrowLeftRight,
  Banknote,
  BookMarked,
  FilePlus2,
  Landmark,
  PieChart,
  Receipt,
  Scale,
  Settings2,
  Wallet,
} from "lucide-react";
import { buildAccountingPageHref } from "../_lib/helpers";
import { panelShellClassName, SectionHeader } from "./accounting-ui";

const ACTIONS = [
  {
    href: buildAccountingPageHref({ tab: "transactions", entry: "expense" }),
    label: "Post expense",
    hint: "Cash or card spend",
    Icon: Receipt,
  },
  {
    href: buildAccountingPageHref({ tab: "transactions", entry: "bill" }),
    label: "Accrue bill",
    hint: "Vendor payable",
    Icon: FilePlus2,
  },
  {
    href: buildAccountingPageHref({ tab: "transactions", entry: "journal" }),
    label: "Manual journal",
    hint: "Adjusting entry",
    Icon: BookMarked,
  },
  {
    href: buildAccountingPageHref({ tab: "operations" }),
    label: "Sync payments",
    hint: "Post collections",
    Icon: ArrowLeftRight,
  },
  {
    href: "/dashboard/org/accounting/bank",
    label: "Bank recon",
    hint: "Match statements",
    Icon: Landmark,
  },
  {
    href: "/dashboard/org/accounting/periods",
    label: "Close period",
    hint: "Month-end lock",
    Icon: Scale,
  },
  {
    href: "/dashboard/org/accounting/reports",
    label: "P&L / BS",
    hint: "Statements",
    Icon: PieChart,
  },
  {
    href: "/dashboard/org/accounting/budgets",
    label: "Budgets",
    hint: "Vs actual",
    Icon: Wallet,
  },
  {
    href: "/dashboard/org/accounting/distributions",
    label: "Owner payouts",
    hint: "Distributions",
    Icon: Banknote,
  },
  {
    href: "/dashboard/org/accounting/settings",
    label: "Settings",
    hint: "Recognition",
    Icon: Settings2,
  },
] as const;

export function AccountingQuickActions() {
  return (
    <section className={panelShellClassName}>
      <SectionHeader
        title="Bookkeeping actions"
        description="Common double-entry tasks — optimized for one-thumb mobile use."
      />
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 sm:gap-3 sm:p-4 lg:grid-cols-5">
        {ACTIONS.map((action) => (
          <Link
            key={action.href + action.label}
            href={action.href}
            className="flex min-h-[4.75rem] flex-col justify-between rounded-2xl border border-border bg-muted/10 px-3 py-3 transition active:scale-[0.98] hover:border-primary/30 hover:bg-primary/5"
          >
            <action.Icon className="h-4 w-4 text-primary" />
            <div className="mt-2">
              <p className="text-xs font-semibold leading-tight text-foreground sm:text-sm">
                {action.label}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
                {action.hint}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
