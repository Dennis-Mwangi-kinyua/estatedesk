import { createManualJournalAction } from "../actions";
import {
  buttonSecondaryClassName,
  fieldClassName,
  labelClassName,
} from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";


export function AccountingJournalForm({ data }: { data: AccountingPageData }) {
  const { accounts, defaultDate } = data;

  return (
    <section className="rounded-2xl border border-border bg-muted/5 p-5">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        Manual journal
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Post a balanced debit and credit entry for adjustments or non-vendor spend.
      </p>

      <form action={createManualJournalAction} className="mt-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className={labelClassName}>
            Date
            <input
              name="date"
              type="date"
              required
              defaultValue={defaultDate}
              className={fieldClassName}
            />
          </label>

          <label className={labelClassName}>
            Debit
            <select name="debitAccountId" required className={fieldClassName}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} · {account.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            Credit
            <select name="creditAccountId" required className={fieldClassName}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} · {account.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            Amount
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              className={fieldClassName}
            />
          </label>

          <label className={labelClassName}>
            Description
            <input name="description" required className={fieldClassName} />
          </label>
        </div>

        <button type="submit" className={buttonSecondaryClassName}>
          Post journal
        </button>
      </form>
    </section>
  );
}