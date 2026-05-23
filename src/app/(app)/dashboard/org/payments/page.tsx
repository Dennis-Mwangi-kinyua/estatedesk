import Link from "next/link";
import { requireOrgRole } from "@/lib/permissions/guards";
import {
  formatLedgerCurrency,
  formatLedgerDate,
  getOrgLedger,
} from "@/lib/ledger";
import {
  rejectTenantPaymentAction,
  verifyTenantPaymentAction,
} from "./actions";

export const dynamic = "force-dynamic";

function statusClasses(tone: string) {
  switch (tone) {
    case "settled":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "default":
      return "border-red-200 bg-red-50 text-red-700";
    case "overdue":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "due":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
  }
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
        {value}
      </p>
      {note ? <p className="mt-1 text-xs text-neutral-500">{note}</p> : null}
    </div>
  );
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function PaymentsPage() {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"]);

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const ledger = await getOrgLedger(session.activeOrgId);
  const pendingPayments = ledger.recentPayments.filter(
    (payment) => payment.verificationStatus === "PENDING",
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
            Tenant ledger
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Payments and balances
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
            Monthly rent and bill collection for {ledger.period}, including paid
            tenants, partial payments, unpaid accounts, defaults, and total deficit.
          </p>
        </div>

        <Link
          href="/dashboard/org/charges"
          className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
        >
          View Charges
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Expected this month"
          value={formatLedgerCurrency(ledger.totals.expected)}
          note="Rent plus issued bills"
        />
        <StatCard
          label="Paid this month"
          value={formatLedgerCurrency(ledger.totals.paid)}
          note={`${pendingPayments.length} payment${pendingPayments.length === 1 ? "" : "s"} awaiting verification`}
        />
        <StatCard
          label="Deficit"
          value={formatLedgerCurrency(ledger.totals.deficit)}
          note={`${ledger.totals.partial} partial, ${ledger.totals.unpaid} unpaid`}
        />
        <StatCard
          label="Defaults"
          value={ledger.totals.defaulted}
          note="Balances over 5 days overdue"
        />
      </section>

      {pendingPayments.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
            <h2 className="text-base font-semibold text-amber-950">
              Payments awaiting verification
            </h2>
            <p className="mt-1 text-sm text-amber-700">
              Verify only after confirming the M-Pesa message, Paybill statement,
              bank statement, or cash receipt.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Payer</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((payment) => (
                  <tr key={payment.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-medium text-neutral-950">
                      {payment.payerTenant?.fullName ??
                        payment.payerUser?.fullName ??
                        payment.payerName ??
                        payment.payerType}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatStatus(payment.method)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatStatus(payment.targetType)}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatLedgerCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {payment.externalReference ??
                        payment.reference ??
                        payment.checkoutRequestId ??
                        "-"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatLedgerDate(payment.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-64 flex-col gap-2">
                        <form action={verifyTenantPaymentAction}>
                          <input
                            type="hidden"
                            name="paymentId"
                            value={payment.id}
                          />
                          <button
                            type="submit"
                            className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800"
                          >
                            Verify & Allocate
                          </button>
                        </form>

                        <form
                          action={rejectTenantPaymentAction}
                          className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                        >
                          <input
                            type="hidden"
                            name="paymentId"
                            value={payment.id}
                          />
                          <input
                            type="text"
                            name="reason"
                            placeholder="Optional rejection reason"
                            className="h-9 rounded-xl border border-neutral-200 px-3 text-xs outline-none transition focus:border-neutral-400"
                          />
                          <button
                            type="submit"
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base font-semibold text-neutral-950">
            Tenant payment ledger
          </h2>
        </div>

        {ledger.rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No tenant balances found for this month.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Deficit</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Oldest due</th>
                  <th className="px-4 py-3 font-medium">Last payment</th>
                </tr>
              </thead>
              <tbody>
                {ledger.rows.map((row) => (
                  <tr key={row.tenantId} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/org/tenants/${row.tenantId}`}
                        className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
                      >
                        {row.tenantName}
                      </Link>
                      <p className="mt-1 text-xs text-neutral-500">
                        {row.phone || row.email || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{row.unitLabel}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatLedgerCurrency(row.amountDue)}
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-700">
                      {formatLedgerCurrency(row.amountPaid)}
                    </td>
                    <td className="px-4 py-3 font-medium text-red-700">
                      {formatLedgerCurrency(row.deficit)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                          row.tone,
                        )}`}
                      >
                        {row.paymentStatus}
                      </span>
                      {row.daysPastDue > 0 ? (
                        <p className="mt-1 text-xs text-neutral-500">
                          {row.daysPastDue} days overdue
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatLedgerDate(row.oldestDueDate)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatLedgerDate(row.lastPaymentAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base font-semibold text-neutral-950">
            Recorded payments this month
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Payer</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Gateway</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {ledger.recentPayments.map((payment) => (
                <tr key={payment.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium text-neutral-950">
                    {payment.payerTenant?.fullName ??
                      payment.payerUser?.fullName ??
                      payment.payerName ??
                      payment.payerType}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{payment.targetType}</td>
                  <td className="px-4 py-3 font-semibold">
                    {formatLedgerCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatStatus(payment.gatewayStatus)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatStatus(payment.verificationStatus)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {payment.reference ??
                      payment.externalReference ??
                      payment.checkoutRequestId ??
                      "-"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatLedgerDate(payment.paidAt ?? payment.createdAt)}
                  </td>
                </tr>
              ))}
              {ledger.recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    No payments recorded this month.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
