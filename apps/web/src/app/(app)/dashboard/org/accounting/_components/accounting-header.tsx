import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import {
  ArrowLeft,
  BookOpen,
  FileSpreadsheet,
  Inbox,
  Receipt,
} from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { ACCOUNTING_WORKFLOW_STEPS } from "../_lib/constants";
import { buildAccountingPageHref } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { panelShellClassName } from "./accounting-ui";

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
  const { org, currentPeriod, booksHealth } = data;

  return (
    <section className={panelShellClassName}>
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-xs sm:tracking-[0.14em]">
                <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Double-entry GL
              </span>
              {currentPeriod ? (
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200 sm:text-xs">
                  {currentPeriod.name} · {currentPeriod.status}
                </span>
              ) : null}
              <span className="inline-flex rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
                {data.settings.recognitionMode} books
              </span>
              {booksHealth ? (
                <span className="inline-flex rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
                  {booksHealth.journalCountMonth} journals MTD
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:mt-4 sm:text-3xl">
              Accounting
            </h1>

            <p className="mt-1.5 text-sm leading-6 text-muted-foreground sm:mt-2 sm:text-base">
              Advanced bookkeeping for {org.name}: journals, aging, cash position,
              period close, and statements in one mobile-first ledger.
            </p>

            <div className="mt-2">
              <InAppGuideHint topic="rent" workspace="org" orgRole={orgRole} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Link
              href="/dashboard/org"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted/30 sm:h-10 sm:px-4 sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/org/accounting/requests"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted/30 sm:h-10 sm:px-4 sm:text-sm"
            >
              <Inbox className="h-4 w-4 shrink-0" />
              Requests
              {pendingRequests > 0 ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground sm:text-xs">
                  {pendingRequests}
                </span>
              ) : null}
            </Link>
            <Link
              href="/dashboard/org/accounting/reports"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted/30 sm:h-10 sm:px-4 sm:text-sm"
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              Statements
            </Link>
            <Link
              href={buildAccountingPageHref({ tab: "transactions", entry: "expense" })}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:h-10 sm:px-4 sm:text-sm"
            >
              <Receipt className="h-4 w-4 shrink-0" />
              Record spend
            </Link>
          </div>
        </div>

        {/* Workflow: horizontal scroll on phone, grid on larger */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:mt-5 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
          {ACCOUNTING_WORKFLOW_STEPS.map((item) => (
            <div
              key={item.step}
              className="min-w-[11.5rem] shrink-0 rounded-2xl border border-border bg-muted/10 px-3.5 py-3.5 sm:min-w-0 sm:px-4 sm:py-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary sm:text-xs">
                {item.step}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground">
                {item.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {message ? (
        <div className="border-t border-border bg-muted/15 px-4 py-3 sm:px-6">
          <p className="text-sm leading-6 text-foreground">{message}</p>
        </div>
      ) : null}
    </section>
  );
}
