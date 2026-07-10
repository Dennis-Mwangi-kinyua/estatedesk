import Link from "next/link";
import { BookCopy } from "lucide-react";
import {
  createAccountingAccountAction,
  setAccountingAccountActiveAction,
  updateAccountingAccountAction,
} from "../coa-actions";
import type { getChartOfAccountsPageData } from "../_lib/coa-queries";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  formatMoney,
  labelClassName,
} from "../_lib/helpers";
import { isLockedSystemAccount } from "@/lib/accounting/accounts";
import { panelShellClassName, SectionHeader } from "./accounting-ui";

type CoaPageData = Awaited<ReturnType<typeof getChartOfAccountsPageData>>;

export function AccountingCoaWorkspace({
  data,
  message,
}: {
  data: CoaPageData;
  message?: string;
}) {
  const { org, grouped, parentOptions } = data;

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      ) : null}

      <section className={panelShellClassName}>
        <SectionHeader
          icon={BookCopy}
          title="Chart of accounts"
          description="Manage ledger accounts, hierarchy, and activation. System control accounts stay protected."
        />

        <div className="space-y-6 px-5 py-5 sm:px-6">
          {grouped.map((group) => (
            <div key={group.type}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {group.type}
              </h3>
              <div className="mt-3 space-y-3">
                {group.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="rounded-2xl border border-border bg-muted/10 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/dashboard/org/accounting/accounts/${account.id}`}
                            className="text-sm font-semibold text-foreground hover:text-primary"
                          >
                            {account.code} · {account.name}
                          </Link>
                          {!account.isActive ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                              Inactive
                            </span>
                          ) : null}
                          {account.systemKey ? (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                              System
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          YTD balance {formatMoney(account.balance, org.currencyCode)}
                          {account.parent
                            ? ` · Parent ${account.parent.code}`
                            : ""}
                        </p>
                        {account.description ? (
                          <p className="mt-2 text-sm text-muted-foreground">{account.description}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!isLockedSystemAccount(account) ? (
                          <form action={setAccountingAccountActiveAction}>
                            <input type="hidden" name="accountId" value={account.id} />
                            <input
                              type="hidden"
                              name="isActive"
                              value={account.isActive ? "false" : "true"}
                            />
                            <button type="submit" className={buttonSecondaryClassName}>
                              {account.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>

                    <form action={updateAccountingAccountAction} className="mt-4 grid gap-3 md:grid-cols-4">
                      <input type="hidden" name="accountId" value={account.id} />
                      <label className={labelClassName}>
                        Name
                        <input
                          name="name"
                          defaultValue={account.name}
                          className={fieldClassName}
                        />
                      </label>
                      <label className={labelClassName}>
                        Parent
                        <select
                          name="parentId"
                          defaultValue={account.parentId ?? ""}
                          className={fieldClassName}
                        >
                          <option value="">No parent</option>
                          {parentOptions
                            .filter(
                              (option) =>
                                option.id !== account.id && option.type === account.type,
                            )
                            .map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.code} · {option.name}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className={`${labelClassName} md:col-span-2`}>
                        Description
                        <input
                          name="description"
                          defaultValue={account.description ?? ""}
                          className={fieldClassName}
                        />
                      </label>
                      <div className="flex items-end md:col-span-4">
                        <button type="submit" className={buttonSecondaryClassName}>
                          Save account
                        </button>
                      </div>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={panelShellClassName}>
        <SectionHeader
          title="Add account"
          description="Create a custom ledger account under the correct account type."
        />
        <form action={createAccountingAccountAction} className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
          <label className={labelClassName}>
            Code
            <input name="code" required placeholder="5950" className={fieldClassName} />
          </label>
          <label className={labelClassName}>
            Name
            <input name="name" required className={fieldClassName} />
          </label>
          <label className={labelClassName}>
            Type
            <select name="type" required className={fieldClassName}>
              <option value="ASSET">Asset</option>
              <option value="LIABILITY">Liability</option>
              <option value="EQUITY">Equity</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </label>
          <label className={labelClassName}>
            Parent
            <select name="parentId" className={fieldClassName}>
              <option value="">No parent</option>
              {parentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.code} · {option.name} ({option.type})
                </option>
              ))}
            </select>
          </label>
          <label className={`${labelClassName} sm:col-span-2`}>
            Description
            <input name="description" className={fieldClassName} />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={buttonPrimaryClassName}>
              Create account
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}