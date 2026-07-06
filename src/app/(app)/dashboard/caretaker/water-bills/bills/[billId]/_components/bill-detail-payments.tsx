import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { StatusBadge } from "@/app/(app)/dashboard/caretaker/water-bills/_components/water-bills-ui";
import {
  formatCurrency,
  formatDate,
} from "@/app/(app)/dashboard/caretaker/water-bills/_lib/helpers";
import { paymentStatusTone } from "../_lib/helpers";
import type { CaretakerBillDetailPageData } from "../_lib/types";

export function BillDetailPayments({
  data,
}: {
  data: Extract<CaretakerBillDetailPageData, { ok: true }>;
}) {
  const { bill } = data;

  return (
    <section className={panelShellClassName}>
      <SectionIntro eyebrow="Payments" title="Payment history" />

      {bill.payments.length === 0 ? (
        <div className={`${panelBodyClassName} pt-0`}>
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-sm text-muted-foreground">
            No payments recorded for this bill yet.
          </div>
        </div>
      ) : (
        <div className={`space-y-3 ${panelBodyClassName} pt-0`}>
          {bill.payments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-2xl border border-border bg-muted/10 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Method: {payment.method}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Paid at: {formatDate(payment.paidAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reference:{" "}
                    {payment.reference ?? payment.externalReference ?? "—"}
                  </p>
                </div>

                <StatusBadge
                  label={`${payment.gatewayStatus} · ${payment.verificationStatus}`}
                  tone={paymentStatusTone(
                    payment.gatewayStatus,
                    payment.verificationStatus,
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}