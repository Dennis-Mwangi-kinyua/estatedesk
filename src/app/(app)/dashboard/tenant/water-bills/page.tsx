import Link from "next/link";
import type { ReactNode } from "react";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import {
  Prisma,
  BillStatus,
  GatewayStatus,
  VerificationStatus,
} from "@prisma/client";
import { CalendarDays, Droplets, ReceiptText, Waves } from "lucide-react";

const tenantWaterBillsArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    waterBills: {
      orderBy: {
        dueDate: "desc",
      },
      take: 60,
      include: {
        unit: {
          include: {
            building: true,
            property: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            receipt: true,
          },
        },
      },
    },
  },
});

type TenantWaterBillsPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

type TenantWaterBillsResult = Prisma.TenantGetPayload<typeof tenantWaterBillsArgs>;
type WaterBillItem = TenantWaterBillsResult["waterBills"][number];

type PreparedWaterBill = {
  id: string;
  period: string;
  unitLabel: string;
  dueDateLabel: string;
  status: BillStatus;
  statusLabel: string;
  totalLabel: string;
  ratePerUnitLabel: string;
  fixedChargeLabel: string;
  outstandingLabel: string;
  unitsUsed: number;
  notes: string | null;
  receiptHref: string | null;
};

const HISTORY_PAGE_SIZE = 10;
const RECENT_BILLS_COUNT = 6;

function formatMoney(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return "N/A";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getBillStatusLabel(status: BillStatus) {
  return status.replaceAll("_", " ");
}

function getBillStatusClasses(status: BillStatus) {
  switch (status) {
    case "PAID_VERIFIED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PAYMENT_PENDING":
    case "PAID_PENDING_VERIFICATION":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "DISPUTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "ISSUED":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "CANCELLED":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function isSuccessfulPayment(status: GatewayStatus) {
  return status === "SUCCESS";
}

function isVerifiedOrNotRequired(status: VerificationStatus) {
  return status === "VERIFIED" || status === "NOT_REQUIRED";
}

function getReceiptHref(bill: WaterBillItem) {
  const paymentWithReceipt = bill.payments.find(
    (payment) =>
      payment.receipt &&
      isSuccessfulPayment(payment.gatewayStatus) &&
      isVerifiedOrNotRequired(payment.verificationStatus)
  );

  if (!paymentWithReceipt?.receipt) {
    return null;
  }

  return (
    paymentWithReceipt.receipt.pdfUrl ??
    `/tenant/receipts/${paymentWithReceipt.receipt.id}`
  );
}

function getOutstandingAmount(bill: WaterBillItem) {
  return bill.status === "PAID_VERIFIED" ? 0 : Number(bill.total ?? 0);
}

function getUnitLabel(bill: WaterBillItem) {
  const buildingName = bill.unit.building?.name
    ? ` • ${bill.unit.building.name}`
    : "";

  return `${bill.unit.property.name} • Unit ${bill.unit.houseNo}${buildingName}`;
}

function prepareWaterBill(bill: WaterBillItem): PreparedWaterBill {
  return {
    id: bill.id,
    period: bill.period,
    unitLabel: getUnitLabel(bill),
    dueDateLabel: formatDate(bill.dueDate),
    status: bill.status,
    statusLabel: getBillStatusLabel(bill.status),
    totalLabel: formatMoney(bill.total),
    ratePerUnitLabel: formatMoney(bill.ratePerUnit),
    fixedChargeLabel: formatMoney(bill.fixedCharge),
    outstandingLabel: formatMoney(getOutstandingAmount(bill)),
    unitsUsed: Number(bill.unitsUsed ?? 0),
    notes: bill.notes ?? null,
    receiptHref: getReceiptHref(bill),
  };
}

function clampPage(page: number, totalPages: number) {
  if (Number.isNaN(page) || page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        {children}
      </div>
    </div>
  );
}

function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border border-black/5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-[#fafafa] p-4">
      <div className="flex items-center gap-2 text-neutral-500">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
          {icon}
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>
      <p className="mt-3 text-[15px] font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <SurfaceCard className="p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
        Water Bills
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        No water bills found for your account.
      </p>
    </SurfaceCard>
  );
}

function ReceiptAction({ href }: { href: string | null }) {
  if (!href) {
    return (
      <span className="inline-flex items-center rounded-[16px] border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-500">
        No receipt available
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
    >
      Download Receipt
    </Link>
  );
}

function PaginationLink({
  page,
  currentPage,
  children,
  disabled = false,
}: {
  page: number;
  currentPage: number;
  children: ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex items-center rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-400">
        {children}
      </span>
    );
  }

  const active =
    page === currentPage
      ? "border-neutral-900 bg-neutral-900 text-white"
      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50";

  return (
    <Link
      href={`?page=${page}`}
      className={`inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium ${active}`}
    >
      {children}
    </Link>
  );
}

export default async function TenantWaterBillsPage({
  searchParams,
}: TenantWaterBillsPageProps) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedPage = Number(resolvedSearchParams.page ?? "1");

  const tenant: TenantWaterBillsResult | null = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    ...tenantWaterBillsArgs,
  });

  const waterBills = tenant?.waterBills ?? [];

  if (!tenant || waterBills.length === 0) {
    return (
      <PageShell>
        <EmptyState />
      </PageShell>
    );
  }

  const preparedBills = waterBills.map(prepareWaterBill);
  const latestBill = preparedBills[0] ?? null;

  const totals = waterBills.reduce(
    (acc, bill) => {
      acc.totalBilled += Number(bill.total ?? 0);
      acc.totalUnitsUsed += Number(bill.unitsUsed ?? 0);
      acc.outstanding += getOutstandingAmount(bill);

      if (bill.status === "PAID_VERIFIED") {
        acc.paidCount += 1;
      }

      return acc;
    },
    {
      totalBilled: 0,
      totalUnitsUsed: 0,
      outstanding: 0,
      paidCount: 0,
    }
  );

  const totalPages = Math.max(
    1,
    Math.ceil(preparedBills.length / HISTORY_PAGE_SIZE)
  );
  const currentPage = clampPage(requestedPage, totalPages);
  const historyStart = (currentPage - 1) * HISTORY_PAGE_SIZE;
  const historyEnd = historyStart + HISTORY_PAGE_SIZE;
  const paginatedHistory = preparedBills.slice(historyStart, historyEnd);

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <SurfaceCard className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Water Billing
              </p>
              <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
                Water Bills
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                View your water usage, bill totals, due dates, payment status,
                and billing history.
              </p>
            </div>

            {latestBill ? (
              <div className="rounded-[24px] bg-[#f7f7fa] px-4 py-4 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Latest Bill
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-950">
                  {latestBill.totalLabel}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {latestBill.period} • Due {latestBill.dueDateLabel}
                </p>
              </div>
            ) : null}
          </div>
        </SurfaceCard>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
          <StatCard
            icon={<Droplets className="h-4 w-4" />}
            label="Total Billed"
            value={formatMoney(totals.totalBilled)}
          />
          <StatCard
            icon={<CalendarDays className="h-4 w-4" />}
            label="Outstanding"
            value={formatMoney(totals.outstanding)}
          />
          <StatCard
            icon={<ReceiptText className="h-4 w-4" />}
            label="Paid Bills"
            value={totals.paidCount}
          />
          <StatCard
            icon={<Waves className="h-4 w-4" />}
            label="Units Used"
            value={totals.totalUnitsUsed}
          />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
              Current & Recent Bills
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Card view for quick review of your latest water bills.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {preparedBills.slice(0, RECENT_BILLS_COUNT).map((bill) => (
              <SurfaceCard key={bill.id} className="p-4 sm:p-5">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[20px] font-semibold tracking-tight text-neutral-950">
                          {bill.period}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getBillStatusClasses(
                            bill.status
                          )}`}
                        >
                          {bill.statusLabel}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-neutral-500">
                        {bill.unitLabel}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Total
                      </p>
                      <p className="mt-1 text-lg font-semibold text-neutral-950">
                        {bill.totalLabel}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[18px] bg-[#fafafa] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Units Used
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                        {bill.unitsUsed}
                      </p>
                    </div>

                    <div className="rounded-[18px] bg-[#fafafa] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Due Date
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                        {bill.dueDateLabel}
                      </p>
                    </div>

                    <div className="rounded-[18px] bg-[#fafafa] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Rate Per Unit
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                        {bill.ratePerUnitLabel}
                      </p>
                    </div>

                    <div className="rounded-[18px] bg-[#fafafa] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Outstanding
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                        {bill.outstandingLabel}
                      </p>
                    </div>
                  </div>

                  {bill.fixedChargeLabel !== formatMoney(0) ? (
                    <div className="rounded-[18px] bg-[#fafafa] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Fixed Charge
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                        {bill.fixedChargeLabel}
                      </p>
                    </div>
                  ) : null}

                  {bill.notes ? (
                    <div className="rounded-[18px] bg-[#fafafa] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Notes
                      </p>
                      <p className="mt-1 text-sm text-neutral-700">
                        {bill.notes}
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <ReceiptAction href={bill.receiptHref} />
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </section>

        <SurfaceCard className="p-4 sm:p-6 xl:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
                Bills History
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Full history of your water bills with totals, due dates, and
                receipt access.
              </p>
            </div>
            <span className="text-xs font-medium text-neutral-500">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="mt-5 space-y-3 lg:hidden">
            {paginatedHistory.map((bill) => (
              <div
                key={`history-${bill.id}`}
                className="rounded-[22px] border border-black/5 bg-[#fafafa] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-950">
                      {bill.period}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {bill.unitLabel}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getBillStatusClasses(
                      bill.status
                    )}`}
                  >
                    {bill.statusLabel}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[16px] bg-white px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                      Amount
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-950">
                      {bill.totalLabel}
                    </p>
                  </div>

                  <div className="rounded-[16px] bg-white px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                      Due Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-950">
                      {bill.dueDateLabel}
                    </p>
                  </div>

                  <div className="rounded-[16px] bg-white px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                      Units Used
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-950">
                      {bill.unitsUsed}
                    </p>
                  </div>

                  <div className="rounded-[16px] bg-white px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                      Outstanding
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-950">
                      {bill.outstandingLabel}
                    </p>
                  </div>
                </div>

                {bill.receiptHref ? (
                  <div className="mt-3">
                    <Link
                      href={bill.receiptHref}
                      className="inline-flex items-center gap-2 rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm font-medium text-neutral-800"
                    >
                      <ReceiptText className="h-4 w-4" />
                      Download Receipt
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-[24px] border border-black/5 bg-white lg:block">
            <table className="min-w-full text-sm">
              <thead className="border-b border-neutral-200 bg-[#fcfcfd]">
                <tr className="text-left text-neutral-500">
                  <th className="px-5 py-4 font-medium">Period</th>
                  <th className="px-5 py-4 font-medium">Property</th>
                  <th className="px-5 py-4 font-medium">Units Used</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Outstanding</th>
                  <th className="px-5 py-4 font-medium">Due Date</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((bill) => (
                  <tr
                    key={bill.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-5 py-4 font-semibold text-neutral-950">
                      {bill.period}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {bill.unitLabel}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {bill.unitsUsed}
                    </td>
                    <td className="px-5 py-4 font-semibold text-neutral-950">
                      {bill.totalLabel}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {bill.outstandingLabel}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {bill.dueDateLabel}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getBillStatusClasses(
                          bill.status
                        )}`}
                      >
                        {bill.statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {bill.receiptHref ? (
                        <Link
                          href={bill.receiptHref}
                          className="inline-flex items-center gap-1 font-medium text-neutral-900 hover:text-neutral-700"
                        >
                          Download
                        </Link>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
            <p className="text-sm text-neutral-500">
              Showing {historyStart + 1}–
              {Math.min(historyEnd, preparedBills.length)} of {preparedBills.length}
            </p>

            <div className="flex flex-wrap gap-2">
              <PaginationLink
                page={currentPage - 1}
                currentPage={currentPage}
                disabled={currentPage === 1}
              >
                Previous
              </PaginationLink>

              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter((page) => {
                  if (totalPages <= 5) return true;
                  if (page === 1 || page === totalPages) return true;
                  return Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, pages) => {
                  const previousPage = pages[index - 1];
                  const showGap = previousPage && page - previousPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-2">
                      {showGap ? (
                        <span className="px-1 text-sm text-neutral-400">…</span>
                      ) : null}
                      <PaginationLink page={page} currentPage={currentPage}>
                        {page}
                      </PaginationLink>
                    </div>
                  );
                })}

              <PaginationLink
                page={currentPage + 1}
                currentPage={currentPage}
                disabled={currentPage === totalPages}
              >
                Next
              </PaginationLink>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </PageShell>
  );
}