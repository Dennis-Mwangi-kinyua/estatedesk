import { recordExpenseAction } from "../actions";
import {
  buttonPrimaryClassName,
  fieldClassName,
  labelClassName,
} from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";


export function AccountingExpenseForm({
  data,
}: {
  data: AccountingPageData;
}) {
  const { vendors, expenseAccounts, properties, defaultDate } = data;

  return (
    <section className="rounded-2xl border border-border bg-muted/5 p-5">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        Record paid expense
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Post a vendor expense directly to the ledger with a matching bank credit.
      </p>

      <form action={recordExpenseAction} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClassName}>
            Vendor
            <select name="vendorId" required className={fieldClassName}>
              <option value="">Select vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            Expense account
            <select name="accountId" required className={fieldClassName}>
              <option value="">Select account</option>
              {expenseAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} · {account.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            Property
            <select name="propertyId" className={fieldClassName}>
              <option value="">Portfolio-wide</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>

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
            Paid from
            <select name="paymentMethod" className={fieldClassName}>
              <option value="BANK">Bank</option>
              <option value="MPESA">M-Pesa</option>
              <option value="CASH">Cash</option>
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

          <label className={`${labelClassName} sm:col-span-2`}>
            Description
            <input name="description" required className={fieldClassName} />
          </label>

          <label className={labelClassName}>
            Bill/reference number
            <input name="billNumber" className={fieldClassName} />
          </label>

          <label className={labelClassName}>
            Notes
            <input name="notes" className={fieldClassName} />
          </label>
        </div>

        <button type="submit" className={buttonPrimaryClassName}>
          Post expense
        </button>
      </form>
    </section>
  );
}