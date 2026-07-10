import { Settings2 } from "lucide-react";
import {
  updateAccountingSettingsAction,
  syncAccrualsAction,
} from "../actions";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  formatMoney,
  labelClassName,
} from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { panelShellClassName, SectionHeader } from "./accounting-ui";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function AccountingSettingsWorkspace({
  data,
  message,
}: {
  data: AccountingPageData;
  message?: string;
}) {
  const { settings, org, summary } = data;

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      ) : null}

      <section className={panelShellClassName}>
        <SectionHeader
          icon={Settings2}
          title="Accounting settings"
          description="Configure how EstateDesk keeps your books — no external accounting software required."
        />

        <form action={updateAccountingSettingsAction} className="space-y-5 px-5 py-5 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className={labelClassName}>
              Recognition mode
              <select
                name="recognitionMode"
                defaultValue={settings.recognitionMode}
                className={fieldClassName}
              >
                <option value="ACCRUAL">Accrual (bill when charged, collect when paid)</option>
                <option value="CASH">Cash (recognize income when payment is received)</option>
              </select>
            </label>

            <label className={labelClassName}>
              Fiscal year starts
              <select
                name="fiscalYearStartMonth"
                defaultValue={String(settings.fiscalYearStartMonth)}
                className={fieldClassName}
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={String(index + 1)}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3">
              <input
                type="checkbox"
                name="autoPostPayments"
                defaultChecked={settings.autoPostPayments}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Auto-post verified payments
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Post cash receipts to the ledger when payments are verified.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3">
              <input
                type="checkbox"
                name="autoPostBilling"
                defaultChecked={settings.autoPostBilling}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Auto-post billing accruals
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  In accrual mode, post rent and water charges when they are issued.
                </span>
              </span>
            </label>
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-sm font-semibold text-foreground">Owner statement delivery</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Email PDF owner statements automatically for the previous calendar month.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                <input
                  type="checkbox"
                  name="ownerStatementEmailEnabled"
                  defaultChecked={settings.ownerStatementEmailEnabled}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    Enable monthly email delivery
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Requires landlord email addresses and the owner-statements cron job.
                  </span>
                </span>
              </label>
              <label className={labelClassName}>
                Send on day of month
                <select
                  name="ownerStatementEmailDayOfMonth"
                  defaultValue={String(settings.ownerStatementEmailDayOfMonth)}
                  className={fieldClassName}
                >
                  {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => (
                    <option key={day} value={String(day)}>
                      Day {day}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {settings.ownerStatementLastSentAt ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Last automated send: {settings.ownerStatementLastSentAt.toLocaleString("en-KE")}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className={buttonPrimaryClassName}>
              Save settings
            </button>
          </div>
        </form>
      </section>

      <section className={panelShellClassName}>
        <SectionHeader
          title="Ledger maintenance"
          description="Backfill accrual entries for outstanding rent and water bills that were issued before accounting was enabled."
        />

        <div className="space-y-4 px-5 py-5 sm:px-6">
          {summary ? (
            <p className="text-sm text-muted-foreground">
              GL tenant receivables balance:{" "}
              <span className="font-semibold text-foreground">
                {formatMoney(summary.controlBalances.receivables, org.currencyCode)}
              </span>
            </p>
          ) : null}

          <form action={syncAccrualsAction}>
            <button type="submit" className={buttonSecondaryClassName}>
              Sync outstanding billing accruals
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}