import { CurrencySelect } from "@/components/forms/currency-select";
import { createPlatformExpenditureAction } from "../actions";
import {
  PAYMENT_METHODS,
  PLATFORM_EXPENDITURE_CATEGORIES,
} from "../_lib/constants";
import { fieldClassName, labelClassName } from "../_lib/helpers";

export function ExpenditureForm({ defaultDate }: { defaultDate: string }) {
  return (
    <form action={createPlatformExpenditureAction} className="space-y-4 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-slate-950 dark:text-white">
        Record platform expenditure
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className={labelClassName}>
          Description
          <input name="description" required className={fieldClassName} />
        </label>

        <label className={labelClassName}>
          Category
          <select name="category" className={fieldClassName}>
            {PLATFORM_EXPENDITURE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
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
          Currency
          <CurrencySelect
            name="currencyCode"
            defaultValue="KES"
            className={fieldClassName}
          />
        </label>

        <label className={labelClassName}>
          Date
          <input
            name="incurredAt"
            type="date"
            required
            defaultValue={defaultDate}
            className={fieldClassName}
          />
        </label>

        <label className={labelClassName}>
          Payee
          <input name="payee" className={fieldClassName} />
        </label>

        <label className={labelClassName}>
          Reference
          <input name="reference" className={fieldClassName} />
        </label>

        <label className={labelClassName}>
          Payment method
          <select name="paymentMethod" className={fieldClassName}>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        <input
          name="paid"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400 dark:border-white/20 dark:bg-slate-900 dark:text-white"
        />
        Already paid
      </label>

      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
      >
        Save expenditure
      </button>
    </form>
  );
}