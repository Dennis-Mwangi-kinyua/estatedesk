import Link from "next/link";
import { Building2, Landmark } from "lucide-react";
import {
  completeBankReconciliationAction,
  createBankAccountAction,
  importGlBankStatementAction,
  seedBankAccountsAction,
  startBankReconciliationAction,
} from "../bank-actions";
import type { getBankPageData } from "../_lib/bank-queries";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  formatDate,
  formatMoney,
  labelClassName,
} from "../_lib/helpers";
import { panelShellClassName, SectionHeader, StatCard } from "./accounting-ui";

type BankPageData = Awaited<ReturnType<typeof getBankPageData>>;

export function AccountingBankWorkspace({
  data,
  message,
  bankAccountId,
  assetAccounts,
}: {
  data: BankPageData;
  message?: string;
  bankAccountId?: string;
  assetAccounts: Array<{ id: string; code: string; name: string }>;
}) {
  const { org, bankAccounts, selected, unclearedLines, reconciliations, balances } = data;
  const selectedId = bankAccountId ?? selected?.id;

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      ) : null}

      {bankAccounts.length === 0 ? (
        <section className={panelShellClassName}>
          <div className="px-5 py-8 text-center sm:px-6">
            <p className="text-sm text-muted-foreground">
              No bank accounts yet. Seed the default cash accounts linked to your chart of accounts.
            </p>
            <form action={seedBankAccountsAction} className="mt-4">
              <button type="submit" className={buttonPrimaryClassName}>
                Set up bank accounts
              </button>
            </form>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map((balance) => (
              <Link
                key={balance.id}
                href={`/dashboard/org/accounting/bank?bankAccountId=${balance.id}`}
              >
                <StatCard
                  label={balance.name}
                  value={formatMoney(balance.glBalance, org.currencyCode)}
                  Icon={Landmark}
                  highlight={balance.id === selectedId}
                />
              </Link>
            ))}
          </section>

          {selected ? (
            <section className={panelShellClassName}>
              <SectionHeader
                icon={Building2}
                title={selected.name}
                description={`Ledger ${selected.ledgerAccount.code} · ${selected.ledgerAccount.name}`}
              />

              <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 sm:px-6">
                <StatCard
                  label="GL balance"
                  value={formatMoney(selected.glBalance, org.currencyCode)}
                  compact
                />
                <StatCard
                  label="Last reconciled"
                  value={
                    selected.lastReconciledAt
                      ? formatDate(selected.lastReconciledAt)
                      : "Never"
                  }
                  compact
                />
              </div>

              <form
                action={importGlBankStatementAction}
                className="space-y-3 border-t border-border px-5 py-5 sm:px-6"
              >
                <input type="hidden" name="bankAccountId" value={selected.id} />
                <h3 className="text-sm font-semibold text-foreground">Import bank statement CSV</h3>
                <p className="text-sm text-muted-foreground">
                  Auto-match statement rows to uncleared GL lines by amount, date, and reference.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className={`${labelClassName} min-w-0 flex-1`}>
                    CSV file
                    <input
                      name="statement"
                      type="file"
                      accept=".csv,text/csv"
                      required
                      className={fieldClassName}
                    />
                  </label>
                  <button type="submit" className={buttonSecondaryClassName}>
                    Import &amp; match
                  </button>
                </div>
              </form>

              <form
                action={startBankReconciliationAction}
                className="space-y-4 border-t border-border px-5 py-5 sm:px-6"
              >
                <input type="hidden" name="bankAccountId" value={selected.id} />
                <h3 className="text-sm font-semibold text-foreground">Start reconciliation</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className={labelClassName}>
                    Statement date
                    <input
                      name="periodEnd"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className={fieldClassName}
                    />
                  </label>
                  <label className={labelClassName}>
                    Statement balance
                    <input
                      name="statementBalance"
                      type="number"
                      step="0.01"
                      required
                      className={fieldClassName}
                    />
                  </label>
                  <label className={labelClassName}>
                    Notes
                    <input name="notes" className={fieldClassName} />
                  </label>
                </div>

                {unclearedLines.length > 0 ? (
                  <div className="rounded-2xl border border-border bg-muted/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Uncleared GL lines
                    </p>
                    <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                      {unclearedLines.map((line) => (
                        <label
                          key={line.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              name="clearedJournalLineIds"
                              value={line.id}
                            />
                            <span>
                              {line.journal.entryNumber} · {line.journal.description}
                            </span>
                          </span>
                          <span className="font-medium text-foreground">
                            {formatMoney(Math.abs(line.amount), org.currencyCode)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                <button type="submit" className={buttonPrimaryClassName}>
                  Save reconciliation draft
                </button>
              </form>
            </section>
          ) : null}

          <section className={panelShellClassName}>
            <SectionHeader
              title="Recent reconciliations"
              description="Complete drafts once the statement balance matches cleared GL activity."
            />
            <div className="divide-y divide-border">
              {reconciliations.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
                  No reconciliations yet.
                </p>
              ) : (
                reconciliations.map((recon) => (
                  <div
                    key={recon.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {recon.bankAccount.name} · {formatDate(recon.periodEnd)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Statement {formatMoney(Number(recon.statementBalance), org.currencyCode)} ·
                        GL {formatMoney(Number(recon.glBalance), org.currencyCode)} · {recon.status}
                      </p>
                    </div>
                    {recon.status === "DRAFT" ? (
                      <form action={completeBankReconciliationAction}>
                        <input type="hidden" name="reconciliationId" value={recon.id} />
                        <input
                          type="hidden"
                          name="bankAccountId"
                          value={recon.bankAccountId}
                        />
                        <button type="submit" className={buttonSecondaryClassName}>
                          Complete
                        </button>
                      </form>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={panelShellClassName}>
            <SectionHeader title="Add bank account" description="Link a physical account to a GL asset account." />
            <form action={createBankAccountAction} className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
              <label className={labelClassName}>
                Name
                <input name="name" required className={fieldClassName} />
              </label>
              <label className={labelClassName}>
                Type
                <select name="type" className={fieldClassName}>
                  <option value="BANK">Bank</option>
                  <option value="MPESA">M-Pesa</option>
                  <option value="CASH">Cash</option>
                  <option value="PETTY_CASH">Petty cash</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className={labelClassName}>
                Ledger account
                <select name="ledgerAccountId" required className={fieldClassName}>
                  {assetAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} · {account.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClassName}>
                Institution
                <input name="institutionName" className={fieldClassName} />
              </label>
              <label className={`${labelClassName} sm:col-span-2`}>
                Account number (masked)
                <input name="accountNumberMasked" className={fieldClassName} />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className={buttonSecondaryClassName}>
                  Add bank account
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}