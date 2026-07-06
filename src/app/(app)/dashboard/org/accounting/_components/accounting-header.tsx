import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import {
  ArrowLeft,
  BookOpen,
  FileSpreadsheet,
  Inbox,
  Landmark,
  Receipt,
  Scale,
  TrendingUp,
} from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { ACCOUNTING_WORKFLOW_STEPS } from "../_lib/constants";
import { buildAccountingPageHref, formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { StatCard, panelShellClassName } from "./accounting-ui";

export function AccountingHeader({
  data,
  message,
  orgRole,
  pendingRequests = 0,
}: {
  data: AccountingPageData;
  message?: string;
  orgRole?: OrgRole | null;
  pendingRequests?: number;
}) {
  const { org, summary, currentPeriod } = data;

  return (
    <section className={panelShellClassName}>
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                Double-entry general ledger
              </span>
              {currentPeriod ? (
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                  {currentPeriod.name} · {currentPeriod.status}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Accounting
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              Books, expenses, vendors, balances, and property finance in one database
              for {org.name}.
            </p>

            <InAppGuideHint topic="rent" workspace="org" orgRole={orgRole} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/org"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/org/accounting/requests"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <Inbox className="h-4 w-4" />
              Requests
              {pendingRequests > 0 ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {pendingRequests}
                </span>
              ) : null}
            </Link>
            <Link
              href="/dashboard/org/reports"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Reports
            </Link>
            <Link
              href={buildAccountingPageHref({ tab: "transactions", entry: "expense" })}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Receipt className="h-4 w-4" />
              Record expenditure
            </Link>
          </div>
        </div>

        {summary ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Income"
              value={formatMoney(summary.income, org.currencyCode)}
              Icon={TrendingUp}
              compact
            />
            <StatCard
              label="Net income"
              value={formatMoney(summary.netIncome, org.currencyCode)}
              Icon={Scale}
              compact
              highlight={summary.netIncome !== 0}
            />
            <StatCard
              label="Assets"
              value={formatMoney(summary.assets, org.currencyCode)}
              Icon={Landmark}
              compact
            />
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          {ACCOUNTING_WORKFLOW_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-border bg-muted/10 px-4 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                {item.step}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {message ? (
        <div className="border-t border-border bg-muted/15 px-5 py-3 sm:px-6">
          <p className="text-sm leading-6 text-foreground">{message}</p>
        </div>
      ) : null}
    </section>
  );
}