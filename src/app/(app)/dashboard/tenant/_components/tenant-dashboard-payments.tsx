import { formatCurrency, formatDate, getStatusTone } from "@/lib/tenant/tenant-format";

type PaymentItem = {
  id: string;
  amount: unknown;
  reference: string | null;
  method: string;
  gatewayStatus: string;
  verificationStatus: string;
  createdAt: Date;
  paidAt: Date | null;
};

type TenantDashboardPaymentsProps = {
  recentPayments: PaymentItem[];
};

export function TenantDashboardPayments({
  recentPayments,
}: TenantDashboardPaymentsProps) {
  return (
    <div className="rounded-[30px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Recent Payments</p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
            Payment activity
          </h2>
        </div>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
          💳 Latest
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {recentPayments.length === 0 ? (
          <div className="rounded-[24px] bg-neutral-50 p-4 text-sm text-neutral-500">
            No payments found yet.
          </div>
        ) : (
          recentPayments.map((payment) => (
            <div key={payment.id} className="rounded-[24px] bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-950">
                    {formatCurrency(payment.amount as never)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {payment.method} • {payment.reference ?? "No reference"} • {formatDate(payment.paidAt ?? payment.createdAt)}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(
                    payment.verificationStatus
                  )}`}
                >
                  {payment.verificationStatus}
                </span>
              </div>

              <p className="mt-3 text-xs font-medium text-neutral-600">
                Gateway: {payment.gatewayStatus}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}