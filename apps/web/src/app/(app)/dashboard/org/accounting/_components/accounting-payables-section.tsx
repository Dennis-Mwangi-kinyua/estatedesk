import { Receipt } from "lucide-react";
import { payVendorBillAction } from "../actions";
import {
  buttonPrimaryClassName,
  fieldClassName,
  formatDate,
  formatMoney,
  labelClassName,
} from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";


export function AccountingPayablesSection({
  data,
}: {
  data: AccountingPageData;
}) {
  const { org, openBills, properties, defaultDate } = data;
  const propertyNames = new Map(properties.map((property) => [property.id, property.name]));

  return (
    <section className="rounded-2xl border border-border bg-muted/5 p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
        <Receipt className="h-5 w-5 text-primary" />
        Open payables
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Approved vendor bills awaiting payment. Each payment debits accounts
        payable and credits your selected cash account.
      </p>

      <div className="mt-5 space-y-4">
        {openBills.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
            No open vendor bills. Accrue a bill above or record a paid expense
            directly.
          </p>
        ) : (
          openBills.map((bill) => {
            const balanceDue = Number(bill.total) - Number(bill.amountPaid);
            const propertyName = bill.propertyId
              ? propertyNames.get(bill.propertyId)
              : null;

            return (
              <div
                key={bill.id}
                className="rounded-2xl border border-border bg-muted/10 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {bill.vendor.name} · {bill.billNumber}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(bill.billDate)} · Due {formatDate(bill.dueDate)} ·{" "}
                      {bill.status}
                      {propertyName ? ` · ${propertyName}` : ""}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">
                      {formatMoney(balanceDue, bill.currencyCode)} due
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Total {formatMoney(Number(bill.total), bill.currencyCode)}
                    </p>
                  </div>
                </div>

                <form action={payVendorBillAction} className="mt-4 grid gap-3 sm:grid-cols-4">
                  <input type="hidden" name="billId" value={bill.id} />

                  <label className={labelClassName}>
                    Payment date
                    <input
                      name="paymentDate"
                      type="date"
                      required
                      defaultValue={defaultDate}
                      className={fieldClassName}
                    />
                  </label>

                  <label className={labelClassName}>
                    Amount
                    <input
                      name="amount"
                      type="number"
                      min="0.01"
                      max={balanceDue}
                      step="0.01"
                      required
                      defaultValue={balanceDue.toFixed(2)}
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

                  <div className="flex items-end">
                    <button type="submit" className={`${buttonPrimaryClassName} w-full`}>
                      Pay bill
                    </button>
                  </div>
                </form>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}