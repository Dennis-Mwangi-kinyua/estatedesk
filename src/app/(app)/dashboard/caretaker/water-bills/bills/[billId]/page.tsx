import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ billId: string }>;
};

function toNumber(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function BillStatusBadge({ status }: { status: string }) {
  const style =
    status === "PAID_VERIFIED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "PAYMENT_PENDING" || status === "PAID_PENDING_VERIFICATION"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "ISSUED"
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-neutral-200 bg-neutral-100 text-neutral-700";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${style}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function PaymentBadge({
  gatewayStatus,
  verificationStatus,
}: {
  gatewayStatus: string;
  verificationStatus: string;
}) {
  const isVerified = verificationStatus === "VERIFIED";
  const isRejected = verificationStatus === "REJECTED";
  const isSuccess = gatewayStatus === "SUCCESS";

  const style = isVerified
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : isRejected
      ? "border-red-200 bg-red-50 text-red-700"
      : isSuccess
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-neutral-200 bg-neutral-100 text-neutral-700";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${style}`}
    >
      {gatewayStatus} · {verificationStatus}
    </span>
  );
}

export default async function BillDetailPage({ params }: PageProps) {
  const { billId } = await params;

  const bill = await prisma.waterBill.findUnique({
    where: {
      id: billId,
    },
    include: {
      tenant: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
      unit: {
        select: {
          id: true,
          houseNo: true,
          building: {
            select: {
              id: true,
              name: true,
            },
          },
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          method: true,
          reference: true,
          externalReference: true,
          gatewayStatus: true,
          verificationStatus: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!bill) notFound();

  const totalPaid = bill.payments.reduce(
    (sum, payment) => sum + toNumber(payment.amount),
    0
  );

  const balance = Math.max(toNumber(bill.total) - totalPaid, 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      <Link
        href="/dashboard/caretaker/water-bills"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to water bills
      </Link>

      <section className="rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-neutral-500">Tenant bill</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
              House {bill.unit.houseNo}
            </h1>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              {bill.unit.property.name} · {bill.unit.building?.name ?? "No building"} ·{" "}
              {bill.tenant.fullName}
            </p>
          </div>

          <BillStatusBadge status={bill.status} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Period
          </p>
          <p className="mt-2 text-xl font-bold text-neutral-900">{bill.period}</p>
        </div>

        <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Units used
          </p>
          <p className="mt-2 text-xl font-bold text-neutral-900">
            {bill.unitsUsed}
          </p>
        </div>

        <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Rate per unit
          </p>
          <p className="mt-2 text-xl font-bold text-neutral-900">
            {formatCurrency(bill.ratePerUnit)}
          </p>
        </div>

        <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Fixed charge
          </p>
          <p className="mt-2 text-xl font-bold text-neutral-900">
            {formatCurrency(bill.fixedCharge)}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Total bill
          </p>
          <p className="mt-2 text-2xl font-bold text-neutral-900">
            {formatCurrency(bill.total)}
          </p>
        </div>

        <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Total paid
          </p>
          <p className="mt-2 text-2xl font-bold text-neutral-900">
            {formatCurrency(totalPaid)}
          </p>
        </div>

        <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Balance
          </p>
          <p className="mt-2 text-2xl font-bold text-neutral-900">
            {formatCurrency(balance)}
          </p>
        </div>
      </section>

      <section className="rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
          Billing details
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm font-medium text-neutral-500">Tenant</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {bill.tenant.fullName}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {bill.tenant.phone ?? "—"} {bill.tenant.email ? `· ${bill.tenant.email}` : ""}
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm font-medium text-neutral-500">Due date</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {formatDate(bill.dueDate)}
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm font-medium text-neutral-500">Created at</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {formatDate(bill.createdAt)}
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm font-medium text-neutral-500">Updated at</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {formatDate(bill.updatedAt)}
            </p>
          </div>
        </div>

        {bill.notes ? (
          <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm font-medium text-neutral-500">Notes</p>
            <p className="mt-1 text-sm text-neutral-900">{bill.notes}</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
          Payments
        </h2>

        {bill.payments.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
            No payments recorded for this bill yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {bill.payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-2xl border border-neutral-200/80 bg-neutral-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Method: {payment.method}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Paid at: {formatDate(payment.paidAt)}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Reference: {payment.reference ?? payment.externalReference ?? "—"}
                    </p>
                  </div>

                  <PaymentBadge
                    gatewayStatus={payment.gatewayStatus}
                    verificationStatus={payment.verificationStatus}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}