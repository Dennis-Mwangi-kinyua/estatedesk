import Link from "@/components/navigation/workspace-link";
import { ArrowLeftRight, Banknote, BookMarked, FilePlus2, PieChart, Receipt, Scale, Settings2 } from "lucide-react";
import { Landmark, Wallet } from "@/components/shared/colored-icons";
import { buildAccountingPageHref } from "../_lib/helpers";
import { panelShellClassName, SectionHeader } from "./accounting-ui";

const ACTIONS = [
  {
    href: buildAccountingPageHref({ tab: "transactions", entry: "expense" }),
    label: "Post expense",
    hint: "Cash or card spend",
    Icon: Receipt,
    tone: "rose",
  },
  {
    href: buildAccountingPageHref({ tab: "transactions", entry: "bill" }),
    label: "Accrue bill",
    hint: "Vendor payable",
    Icon: FilePlus2,
    tone: "amber",
  },
  {
    href: buildAccountingPageHref({ tab: "transactions", entry: "journal" }),
    label: "Manual journal",
    hint: "Adjusting entry",
    Icon: BookMarked,
    tone: "violet",
  },
  {
    href: buildAccountingPageHref({ tab: "operations" }),
    label: "Sync payments",
    hint: "Post collections",
    Icon: ArrowLeftRight,
    tone: "blue",
  },
  {
    href: "/dashboard/org/accounting/bank",
    label: "Bank recon",
    hint: "Match statements",
    Icon: Landmark,
    tone: "cyan",
  },
  {
    href: "/dashboard/org/accounting/periods",
    label: "Close period",
    hint: "Month-end lock",
    Icon: Scale,
    tone: "emerald",
  },
  {
    href: "/dashboard/org/accounting/reports",
    label: "P&L / BS",
    hint: "Statements",
    Icon: PieChart,
    tone: "indigo",
  },
  {
    href: "/dashboard/org/accounting/budgets",
    label: "Budgets",
    hint: "Vs actual",
    Icon: Wallet,
    tone: "teal",
  },
  {
    href: "/dashboard/org/accounting/distributions",
    label: "Owner payouts",
    hint: "Distributions",
    Icon: Banknote,
    tone: "pink",
  },
  {
    href: "/dashboard/org/accounting/settings",
    label: "Settings",
    hint: "Recognition",
    Icon: Settings2,
    tone: "slate",
  },
] as const;

const iconTones = {
  rose: "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/50",
  amber: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50",
  violet: "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900/50",
  blue: "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-900/50",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900/50",
  teal: "bg-teal-50 text-teal-700 ring-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-900/50",
  pink: "bg-pink-50 text-pink-700 ring-pink-100 dark:bg-pink-950/40 dark:text-pink-300 dark:ring-pink-900/50",
  slate: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
} as const;

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
            className="group flex min-h-[5.25rem] min-w-0 items-center gap-2.5 rounded-2xl border border-border/90 bg-card px-2.5 py-3 transition hover:border-primary/30 hover:bg-primary/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.99] sm:gap-3 sm:px-3"
          >
            <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${iconTones[action.tone]}`}>
              <action.Icon aria-hidden="true" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="break-words text-xs font-semibold leading-snug text-foreground group-hover:text-primary sm:text-sm">
                {action.label}
              </p>
              <p className="mt-1 break-words text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                {action.hint}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
