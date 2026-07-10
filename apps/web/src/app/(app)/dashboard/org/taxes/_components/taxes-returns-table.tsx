import Link from "next/link";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercent,
  getStatusClasses,
} from "../_lib/helpers";
import type { TaxesPageData } from "../_lib/types";

export function TaxesReturnsTable({
  recentReturns,
}: Pick<TaxesPageData, "recentReturns">) {
  return (
    <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-base font-semibold">Recent KRA Rental Returns</h2>
      </div>

      {recentReturns.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No rental income returns found yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Taxpayer</th>
                <th className="px-4 py-3 font-medium">PIN</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Gross Rent</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Tax Due</th>
                <th className="px-4 py-3 font-medium">KRA Status</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">KRA Refs</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentReturns.map((rentalReturn) => {
                const latestAttempt = rentalReturn.attempts[0] ?? null;
                const latestPayment = rentalReturn.linkedPayments[0] ?? null;
                const linkedTaxCharge = rentalReturn.linkedTaxCharges[0] ?? null;

                return (
                  <tr key={rentalReturn.id} className="border-t align-top">
                    <td className="px-4 py-3 font-medium">
                      <div>{rentalReturn.period}</div>
                      {rentalReturn.isNilReturn && (
                        <span className="mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs">
                          NIL RETURN
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {rentalReturn.taxpayerProfile?.displayName ??
                          rentalReturn.taxpayerName ??
                          "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rentalReturn.org.name}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {rentalReturn.taxpayerProfile?.kraPin ?? rentalReturn.taxpayerPin}
                    </td>

                    <td className="px-4 py-3">
                      {rentalReturn.property ? (
                        <Link
                          href="/dashboard/org/properties"
                          className="underline underline-offset-4"
                        >
                          {rentalReturn.property.name}
                        </Link>
                      ) : (
                        <div>
                          <div>All linked properties</div>
                          <div className="text-xs text-muted-foreground">
                            {rentalReturn.items.length} item(s)
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {formatCurrency(rentalReturn.grossRent)}
                    </td>

                    <td className="px-4 py-3">
                      {formatPercent(rentalReturn.taxRate)}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(rentalReturn.taxDue)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                          rentalReturn.status,
                        )}`}
                      >
                        {rentalReturn.status}
                      </span>

                      {latestAttempt && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Last attempt: {latestAttempt.outcome} ·{" "}
                          {formatDateTime(latestAttempt.attemptedAt)}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div>{rentalReturn.filingChannel}</div>
                      <div className="text-xs text-muted-foreground">
                        {rentalReturn.regime} · {rentalReturn.basis}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {latestPayment ? (
                        <div className="space-y-1">
                          <div className="font-medium">
                            {formatCurrency(latestPayment.amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {latestPayment.method} · {latestPayment.gatewayStatus}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Verified: {latestPayment.verificationStatus}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Paid: {formatDateTime(latestPayment.paidAt)}
                          </div>
                        </div>
                      ) : linkedTaxCharge ? (
                        <div className="space-y-1">
                          <div className="font-medium">
                            {formatCurrency(linkedTaxCharge.amountDue)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Paid: {formatCurrency(linkedTaxCharge.amountPaid)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Balance: {formatCurrency(linkedTaxCharge.balance)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Due: {formatDate(linkedTaxCharge.dueDate)}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-1 text-xs">
                        <div>Return Ref: {rentalReturn.kraReturnRef ?? "—"}</div>
                        <div>Assessment: {rentalReturn.assessmentRef ?? "—"}</div>
                        <div>Payment Ref: {rentalReturn.kraPaymentRef ?? "—"}</div>
                        <div>Receipt No: {rentalReturn.kraReceiptNo ?? "—"}</div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div>{formatDateTime(rentalReturn.updatedAt)}</div>
                      <div className="text-xs text-muted-foreground">
                        Submitted: {formatDateTime(rentalReturn.submittedAt)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Paid: {formatDateTime(rentalReturn.paidAt)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}