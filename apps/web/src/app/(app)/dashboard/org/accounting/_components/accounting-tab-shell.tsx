import Link from "next/link";
import {
  ArrowRightLeft,
  BookOpenCheck,
  FilePenLine,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { buildAccountingPageHref } from "../_lib/helpers";
import type { AccountingTab } from "../_lib/types";
import { panelShellClassName } from "./accounting-ui";

const TABS: Array<{
  id: AccountingTab;
  label: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    id: "operations",
    label: "Operations",
    description: "Sync collections and review finance requests.",
    Icon: ArrowRightLeft,
  },
  {
    id: "transactions",
    label: "Post entries",
    description: "Record expenses, accrue bills, or post manual journals.",
    Icon: FilePenLine,
  },
  {
    id: "payables",
    label: "Payables",
    description: "Manage vendors and settle open vendor bills.",
    Icon: Receipt,
  },
  {
    id: "ledger",
    label: "General ledger",
    description: "Review journals, trial balance, and chart of accounts.",
    Icon: BookOpenCheck,
  },
];

export function AccountingTabShell({
  activeTab,
  operations,
  transactions,
  payables,
  ledger,
}: {
  activeTab: AccountingTab;
  operations: ReactNode;
  transactions: ReactNode;
  payables: ReactNode;
  ledger: ReactNode;
}) {
  const panels: Record<AccountingTab, ReactNode> = {
    operations,
    transactions,
    payables,
    ledger,
  };

  const activeMeta = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return (
    <section className={panelShellClassName}>
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-2 py-2 backdrop-blur sm:static sm:px-4 sm:py-3">
        <div
          className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-muted/20 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Accounting workspace"
        >
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={buildAccountingPageHref({ tab: tab.id })}
                role="tab"
                aria-selected={selected}
                className={`inline-flex min-h-11 min-w-[7.25rem] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2.5 text-xs font-semibold transition sm:min-w-[9.5rem] sm:gap-2 sm:px-4 sm:text-sm ${
                  selected
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="border-b border-border bg-muted/10 px-4 py-2.5 sm:px-6 sm:py-3">
        <p className="text-sm font-medium text-foreground">{activeMeta.label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          {activeMeta.description}
        </p>
      </div>

      <div className="p-3 sm:p-5">{panels[activeTab]}</div>
    </section>
  );
}