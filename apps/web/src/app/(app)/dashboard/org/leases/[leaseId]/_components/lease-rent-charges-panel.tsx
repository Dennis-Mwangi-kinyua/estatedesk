import { formatCurrency, formatDate, getChargeStatusClass } from "../_lib/helpers";
import type { LeaseDetailsData } from "../_lib/types";

export function LeaseRentChargesPanel({
  lease,
  currencyCode,
}: {
  lease: LeaseDetailsData["lease"];
  currencyCode: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-base font-semibold">Rent Charges</h2>
      </div>

      {lease.rentCharges.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No rent charges found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Charge</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Amount Due</th>
                <th className="px-4 py-3 font-medium">Amount Paid</th>
                <th className="px-4 py-3 font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {lease.rentCharges.map((charge) => (
                <tr key={charge.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{charge.id}</td>
                  <td className="px-4 py-3">{charge.period}</td>
                  <td className="px-4 py-3">{charge.chargeType}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(charge.amountDue, currencyCode)}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(charge.amountPaid, currencyCode)}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(charge.balance, currencyCode)}
                  </td>
                  <td className="px-4 py-3">{formatDate(charge.dueDate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getChargeStatusClass(
                        charge.status
                      )}`}
                    >
                      {charge.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}