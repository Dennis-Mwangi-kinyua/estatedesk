import Link from "next/link";
import { FileSpreadsheet, NotebookPen } from "lucide-react";
import { postDraftJournalAction, reverseJournalAction } from "../journal-actions";
import type { getJournalRegister } from "@/lib/accounting/journal-queries";
import {
  buttonSecondaryClassName,
  fieldClassName,
  formatDate,
  formatMoney,
  labelClassName,
} from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { AccountingMultiLineJournalForm } from "./accounting-multi-line-journal-form";
import { panelShellClassName, SectionHeader } from "./accounting-ui";

type JournalRegisterData = Awaited<ReturnType<typeof getJournalRegister>>;

function buildJournalQuery(filters: {
  q?: string;
  status?: string;
  sourceType?: string;
  from?: string;
  to?: string;
  page: number;
}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.sourceType) params.set("sourceType", filters.sourceType);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("page", String(filters.page));
  return params.toString();
}

export function AccountingJournalsWorkspace({
  data,
  register,
  message,
  filters,
}: {
  data: AccountingPageData;
  register: JournalRegisterData;
  message?: string;
  filters: {
    q?: string;
    status?: string;
    sourceType?: string;
    from?: string;
    to?: string;
    page: number;
  };
}) {
  const { org, accounts, defaultDate } = data;
  const exportParams = new URLSearchParams();

  if (filters.q) exportParams.set("q", filters.q);
  if (filters.status) exportParams.set("status", filters.status);
  if (filters.sourceType) exportParams.set("sourceType", filters.sourceType);
  if (filters.from) exportParams.set("from", filters.from);
  if (filters.to) exportParams.set("to", filters.to);

  const exportHref = `/dashboard/org/accounting/journals/export?${exportParams.toString()}`;

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      ) : null}

      <section className={panelShellClassName}>
        <SectionHeader
          icon={NotebookPen}
          title="Journal register"
          description="Search, review, export, post drafts, and reverse manual journals."
          action={
            <a href={exportHref} className={buttonSecondaryClassName}>
              Export CSV
            </a>
          }
        />

        <form method="get" className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-2 lg:grid-cols-5 sm:px-6">
          <label className={labelClassName}>
            Search
            <input name="q" defaultValue={filters.q} className={fieldClassName} />
          </label>
          <label className={labelClassName}>
            Status
            <select name="status" defaultValue={filters.status} className={fieldClassName}>
              <option value="">All</option>
              <option value="POSTED">Posted</option>
              <option value="DRAFT">Draft</option>
              <option value="REVERSED">Reversed</option>
            </select>
          </label>
          <label className={labelClassName}>
            Source
            <select name="sourceType" defaultValue={filters.sourceType} className={fieldClassName}>
              <option value="">All</option>
              <option value="MANUAL">Manual</option>
              <option value="PAYMENT">Payment</option>
              <option value="VENDOR_BILL">Vendor bill</option>
              <option value="RENT_CHARGE_ACCRUAL">Rent accrual</option>
              <option value="WATER_BILL_ACCRUAL">Water accrual</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="OWNER_DISTRIBUTION">Owner distribution</option>
            </select>
          </label>
          <label className={labelClassName}>
            From
            <input name="from" type="date" defaultValue={filters.from} className={fieldClassName} />
          </label>
          <label className={labelClassName}>
            To
            <input name="to" type="date" defaultValue={filters.to} className={fieldClassName} />
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-5">
            <button type="submit" className={buttonSecondaryClassName}>
              Apply filters
            </button>
          </div>
        </form>

        <div className="divide-y divide-border">
          {register.journals.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
              No journal entries match the current filters.
            </p>
          ) : (
            register.journals.map((journal) => (
              <div key={journal.id} className="px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{journal.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {journal.entryNumber} · {formatDate(journal.entryDate)} · {journal.status} ·{" "}
                      {journal.sourceType}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {journal.status === "DRAFT" ? (
                      <form action={postDraftJournalAction}>
                        <input type="hidden" name="journalId" value={journal.id} />
                        <button type="submit" className={buttonSecondaryClassName}>
                          Post draft
                        </button>
                      </form>
                    ) : null}
                    {journal.status === "POSTED" &&
                    (journal.sourceType === "MANUAL" || journal.sourceType === "ADJUSTMENT") ? (
                      <form action={reverseJournalAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="journalId" value={journal.id} />
                        <input
                          name="reason"
                          required
                          placeholder="Reversal reason"
                          className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
                        />
                        <button type="submit" className={buttonSecondaryClassName}>
                          Reverse
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  {journal.lines.map((line) => (
                    <div
                      key={line.id}
                      className="flex items-center justify-between gap-4 text-xs text-muted-foreground"
                    >
                      <Link
                        href={`/dashboard/org/accounting/accounts/${line.accountId}`}
                        className="hover:text-foreground"
                      >
                        {line.account.code} · {line.account.name}
                      </Link>
                      <span className="font-medium text-foreground">
                        {Number(line.debit) > 0
                          ? `DR ${formatMoney(Number(line.debit), org.currencyCode)}`
                          : `CR ${formatMoney(Number(line.credit), org.currencyCode)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {register.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm sm:px-6">
            <span className="text-muted-foreground">
              Page {register.page} of {register.totalPages}
            </span>
            <div className="flex gap-2">
              {register.page > 1 ? (
                <Link
                  href={`/dashboard/org/accounting/journals?${buildJournalQuery({
                    ...filters,
                    page: register.page - 1,
                  })}`}
                  className={buttonSecondaryClassName}
                >
                  Previous
                </Link>
              ) : null}
              {register.page < register.totalPages ? (
                <Link
                  href={`/dashboard/org/accounting/journals?${buildJournalQuery({
                    ...filters,
                    page: register.page + 1,
                  })}`}
                  className={buttonSecondaryClassName}
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className={panelShellClassName}>
        <SectionHeader
          icon={FileSpreadsheet}
          title="New journal entry"
          description="Post a balanced multi-line journal or save it as a draft for review."
        />
        <div className="px-5 py-5 sm:px-6">
          <AccountingMultiLineJournalForm
            accounts={accounts
              .filter((account) => account.isActive)
              .map((account) => ({
                id: account.id,
                code: account.code,
                name: account.name,
              }))}
            defaultDate={defaultDate}
          />
        </div>
      </section>
    </div>
  );
}