import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileClock,
  Scale,
} from "lucide-react";
import { buildAccountingPageHref, formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { MetricPill, panelShellClassName, SectionHeader } from "./accounting-ui";

export function AccountingBooksHealth({ data }: { data: AccountingPageData }) {
  const { org, booksHealth, summary } = data;
  if (!summary) return null;

  const issues: Array<{ label: string; href: string; tone: "warn" | "ok" }> = [];

  if (!booksHealth.trialBalance.balanced) {
    issues.push({
      label: "Trial balance out of balance",
      href: buildAccountingPageHref({ tab: "ledger" }),
      tone: "warn",
    });
  }
  if (!booksHealth.balanceSheetBalanced) {
    issues.push({
      label: "Balance sheet does not balance",
      href: "/dashboard/org/accounting/reports",
      tone: "warn",
    });
  }
  if (booksHealth.unpostedPaymentsCount > 0) {
    issues.push({
      label: `${booksHealth.unpostedPaymentsCount} verified payment(s) not in GL`,
      href: buildAccountingPageHref({ tab: "operations" }),
      tone: "warn",
    });
  }
  if (booksHealth.draftJournals > 0) {
    issues.push({
      label: `${booksHealth.draftJournals} draft journal(s)`,
      href: "/dashboard/org/accounting/journals",
      tone: "warn",
    });
  }
  if (!booksHealth.periodOpen && booksHealth.periodStatus) {
    issues.push({
      label: `Period ${booksHealth.periodName} is ${booksHealth.periodStatus}`,
      href: "/dashboard/org/accounting/periods",
      tone: "warn",
    });
  }

  const healthy = issues.length === 0;

  return (
    <section className={panelShellClassName}>
      <SectionHeader
        icon={Scale}
        title="Books health"
        description="Double-entry integrity, period status, and posting backlog for close readiness."
        action={
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
              healthy
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
            }`}
          >
            {healthy ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            {healthy ? "Close-ready" : `${issues.length} attention item(s)`}
          </span>
        }
      />

      <div className="grid gap-2.5 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4 sm:px-6">
        <MetricPill
          label="Trial balance"
          value={
            booksHealth.trialBalance.balanced
              ? "Balanced"
              : `Δ ${formatMoney(Math.abs(booksHealth.trialBalance.difference), org.currencyCode)}`
          }
          tone={booksHealth.trialBalance.balanced ? "positive" : "negative"}
        />
        <MetricPill
          label="Balance sheet"
          value={booksHealth.balanceSheetBalanced ? "Balanced" : "Review"}
          tone={booksHealth.balanceSheetBalanced ? "positive" : "negative"}
        />
        <MetricPill
          label="Expense ratio"
          value={`${booksHealth.expenseRatioPct}%`}
          tone={booksHealth.expenseRatioPct > 70 ? "negative" : "default"}
        />
        <MetricPill
          label="Net margin"
          value={`${booksHealth.netMarginPct}%`}
          tone={booksHealth.netMarginPct >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid gap-2 border-t border-border px-4 py-3 sm:grid-cols-3 sm:px-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClipboardList className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            <span className="font-semibold text-foreground">
              {booksHealth.journalCountMonth}
            </span>{" "}
            journals this month ·{" "}
            <span className="font-semibold text-foreground">
              {booksHealth.journalCountYtd}
            </span>{" "}
            YTD
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileClock className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            Period:{" "}
            <span className="font-semibold text-foreground">
              {booksHealth.periodName ?? "Not configured"}
            </span>
            {booksHealth.periodStatus
              ? ` · ${booksHealth.periodStatus}`
              : ""}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          COA{" "}
          <span className="font-semibold text-foreground">
            {booksHealth.accountCount}
          </span>{" "}
          · Vendors{" "}
          <span className="font-semibold text-foreground">
            {booksHealth.vendorCount}
          </span>
        </div>
      </div>

      {issues.length > 0 ? (
        <ul className="space-y-2 border-t border-border px-4 py-4 sm:px-6">
          {issues.map((issue) => (
            <li key={issue.label}>
              <Link
                href={issue.href}
                className="flex items-start gap-2 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-950 transition hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="font-medium">{issue.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
