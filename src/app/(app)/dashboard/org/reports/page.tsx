import {
  AlertTriangle,
  BadgeCheck,
  Download,
  Receipt,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { requireManagementAccess } from "@/lib/permissions/guards";
import {
  formatLedgerCurrency,
  formatLedgerDate,
  getCurrentPeriod,
  getOrgLedger,
} from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import { ORG_REPORT_EXPORTS } from "@/lib/reports/org-report-exports";

export const dynamic = "force-dynamic";

type ReportsSearchParams = {
  apartment?: string;
  payment?: string;
  period?: string;
};

type OrgReportsPageProps = {
  searchParams?: Promise<ReportsSearchParams>;
};

const paymentFilters = [
  { value: "all", label: "All occupants" },
  { value: "paid", label: "Paid" },
  { value: "not-paid", label: "Not fully paid" },
  { value: "partial", label: "Partial" },
  { value: "unpaid", label: "Unpaid" },
  { value: "default", label: "Default risk" },
  { value: "early", label: "Early payers" },
] as const;

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function ratingForTenant({
  paymentStatus,
  balance,
  amountDue,
  amountPaid,
  lastPaymentAt,
  dueDay,
}: {
  paymentStatus: string;
  balance: number;
  amountDue: number;
  amountPaid: number;
  lastPaymentAt: Date | null;
  dueDay: number | null;
}) {
  if (amountDue <= 0) {
    return {
      score: 0,
      label: "Not billed",
      detail: "No current-period obligation",
    };
  }

  const paidInFull = balance <= 0;
  const paidDay = lastPaymentAt ? lastPaymentAt.getDate() : null;
  const paidEarly = paidInFull && paidDay !== null && dueDay !== null && paidDay <= dueDay;

  if (paidEarly) {
    return {
      score: 5,
      label: "Early payer",
      detail: `Paid by day ${paidDay} against due day ${dueDay}`,
    };
  }

  if (paidInFull) {
    return {
      score: 4,
      label: "Paid in full",
      detail: lastPaymentAt ? `Last paid ${formatLedgerDate(lastPaymentAt)}` : "Fully settled",
    };
  }

  if (amountPaid > 0) {
    return {
      score: 3,
      label: "Partial payer",
      detail: `${formatLedgerCurrency(balance)} still open`,
    };
  }

  if (paymentStatus === "Default") {
    return {
      score: 1,
      label: "Default risk",
      detail: `${formatLedgerCurrency(balance)} overdue`,
    };
  }

  return {
    score: 2,
    label: "Unpaid",
    detail: `${formatLedgerCurrency(balance)} pending`,
  };
}

function ratingTone(score: number) {
  if (score >= 5) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (score >= 4) return "border-sky-200 bg-sky-50 text-sky-800";
  if (score >= 3) return "border-amber-200 bg-amber-50 text-amber-800";
  if (score >= 1) return "border-red-200 bg-red-50 text-red-800";
  return "border-neutral-200 bg-neutral-50 text-neutral-700";
}

function statusTone(status: string) {
  if (status === "Paid in full") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Partial") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status.includes("default") || status === "Default") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (status === "Overdue" || status === "Unpaid") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-neutral-200 bg-neutral-50 text-neutral-700";
}

function Stars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${score} star rating`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < score ? "fill-current text-amber-500" : "text-neutral-300"
          }`}
        />
      ))}
    </div>
  );
}

function reportFilterHref({
  apartment,
  payment,
}: {
  apartment: string;
  payment: string;
}) {
  const params = new URLSearchParams();

  if (apartment !== "all") params.set("apartment", apartment);
  if (payment !== "all") params.set("payment", payment);

  const query = params.toString();
  return query ? `/dashboard/org/reports?${query}` : "/dashboard/org/reports";
}

function filterRowsByPayment<
  T extends {
    amountDue: number;
    amountPaid: number;
    balance: number;
    daysPastDue: number;
    rating: { score: number };
  },
>(rows: T[], paymentFilter: string) {
  switch (paymentFilter) {
    case "paid":
      return rows.filter((row) => row.amountDue > 0 && row.balance <= 0);
    case "not-paid":
      return rows.filter((row) => row.amountDue > 0 && row.balance > 0);
    case "partial":
      return rows.filter((row) => row.amountPaid > 0 && row.balance > 0);
    case "unpaid":
      return rows.filter((row) => row.amountDue > 0 && row.amountPaid <= 0);
    case "default":
      return rows.filter((row) => row.balance > 0 && row.daysPastDue > 5);
    case "early":
      return rows.filter((row) => row.rating.score >= 5);
    default:
      return rows;
  }
}

export default async function OrgReportsPage({
  searchParams,
}: OrgReportsPageProps) {
  const session = await requireManagementAccess();
  const resolvedSearchParams = await searchParams;
  const selectedApartment = resolvedSearchParams?.apartment ?? "all";
  const selectedPayment = resolvedSearchParams?.payment ?? "all";
  const period = resolvedSearchParams?.period ?? getCurrentPeriod();
  const ledger = await getOrgLedger(session.activeOrgId!, period, {
    recentPaymentsTake: 10,
  });

  const dueDays = await prisma.lease.findMany({
    where: {
      orgId: session.activeOrgId!,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      tenantId: true,
      dueDay: true,
    },
  });
  const dueDayByTenant = new Map(dueDays.map((lease) => [lease.tenantId, lease.dueDay]));

  const rows = ledger.rows.map((row) => {
    const rating = ratingForTenant({
      paymentStatus: row.paymentStatus,
      balance: row.balance,
      amountDue: row.amountDue,
      amountPaid: row.amountPaid,
      lastPaymentAt: row.lastPaymentAt,
      dueDay: dueDayByTenant.get(row.tenantId) ?? null,
    });

    return {
      ...row,
      rating,
      dueDay: dueDayByTenant.get(row.tenantId) ?? null,
    };
  });

  const apartmentOptions = Array.from(
    new Set(rows.map((row) => row.propertyName).filter((name) => name && name !== "-")),
  ).sort((a, b) => a.localeCompare(b));
  const apartmentRows =
    selectedApartment === "all"
      ? rows
      : rows.filter((row) => row.propertyName === selectedApartment);
  const filteredRows = filterRowsByPayment(apartmentRows, selectedPayment);
  const paidRows = filteredRows.filter((row) => row.amountDue > 0 && row.balance <= 0);
  const notPaidRows = filteredRows.filter((row) => row.amountDue > 0 && row.balance > 0);
  const scopedTotals = {
    expected: filteredRows.reduce((sum, row) => sum + row.amountDue, 0),
    paid: filteredRows.reduce((sum, row) => sum + row.amountPaid, 0),
    deficit: filteredRows.reduce((sum, row) => sum + row.deficit, 0),
  };
  const collectionRate = scopedTotals.expected
    ? (scopedTotals.paid / scopedTotals.expected) * 100
    : 0;
  const activePaymentFilter =
    paymentFilters.find((filter) => filter.value === selectedPayment) ?? paymentFilters[0];
  const recentExports = await prisma.reportExport.findMany({
    where: { orgId: session.activeOrgId! },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      reportType: true,
      period: true,
      fileName: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-5">
      <section className="ios-panel rounded-[28px] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Reports
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Rent collection report
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
              Current period: {period}. See who has paid, who has not, who is
              partial, and which tenants consistently pay early.
            </p>
            <p className="mt-2 text-xs font-medium text-neutral-500">
              Showing {activePaymentFilter.label.toLowerCase()} for{" "}
              {selectedApartment === "all" ? "all apartments" : selectedApartment}.
            </p>
            <form action="/dashboard/org/reports" className="mt-4 flex max-w-sm gap-2">
              <input
                type="month"
                name="period"
                defaultValue={period}
                className="min-h-11 min-w-0 flex-1 rounded-2xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950 outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
              />
              <button
                type="submit"
                className="rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white"
              >
                Apply
              </button>
            </form>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs font-medium text-neutral-500">Collection rate</p>
              <p className="mt-1 text-3xl font-bold text-neutral-950">
                {formatPercent(collectionRate)}
              </p>
              <div className="mt-3 h-2 w-56 overflow-hidden rounded-full bg-white ring-1 ring-neutral-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(collectionRate, 100)}%` }}
                />
              </div>
            </div>
            <Link
              href={`/api/org/reports/export?type=rent-roll&period=${period}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              <Download className="h-4 w-4" />
              Export rent roll
            </Link>
          </div>
        </div>
      </section>

      <section className="ios-panel rounded-[28px] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-950">Report archive</p>
            <p className="mt-1 text-sm text-neutral-500">
              Recent report downloads generated by this organization.
            </p>
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
            {recentExports.length} recent
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {recentExports.map((item) => (
            <div key={item.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="truncate text-sm font-semibold text-neutral-950">{item.reportType}</p>
              <p className="mt-1 truncate text-xs text-neutral-500">{item.fileName}</p>
              <p className="mt-2 text-xs text-neutral-500">
                {item.period ?? "Current"} •{" "}
                {item.createdAt.toLocaleString("en-KE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          ))}
          {recentExports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-500">
              No report exports yet.
            </div>
          ) : null}
        </div>
      </section>

      <section className="ios-panel rounded-[28px] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-950">Export report pack</p>
            <p className="mt-1 text-sm text-neutral-500">
              Download CSV files for finance review, owner updates, and migration archives.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ORG_REPORT_EXPORTS.map((item) => (
              <Link
                key={item.kind}
                href={`/api/org/reports/export?type=${item.kind}&period=${period}`}
                title={item.description}
                className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
              >
                <Download className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="ios-panel rounded-[28px] p-4 sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.5fr)]">
          <div>
            <p className="text-sm font-semibold text-neutral-950">Apartment</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ReportFilterLink
                href={reportFilterHref({ apartment: "all", payment: selectedPayment })}
                active={selectedApartment === "all"}
              >
                All apartments
              </ReportFilterLink>
              {apartmentOptions.map((apartment) => (
                <ReportFilterLink
                  key={apartment}
                  href={reportFilterHref({ apartment, payment: selectedPayment })}
                  active={selectedApartment === apartment}
                >
                  {apartment}
                </ReportFilterLink>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-950">Occupants</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {paymentFilters.map((filter) => (
                <ReportFilterLink
                  key={filter.value}
                  href={reportFilterHref({
                    apartment: selectedApartment,
                    payment: filter.value,
                  })}
                  active={selectedPayment === filter.value}
                >
                  {filter.label}
                </ReportFilterLink>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <ReportStat icon={Receipt} label="Expected" value={formatLedgerCurrency(scopedTotals.expected)} />
        <ReportStat icon={TrendingUp} label="Paid" value={formatLedgerCurrency(scopedTotals.paid)} />
        <ReportStat icon={AlertTriangle} label="Outstanding" value={formatLedgerCurrency(scopedTotals.deficit)} />
        <ReportStat icon={BadgeCheck} label="Paid tenants" value={paidRows.length.toLocaleString()} />
        <ReportStat icon={Star} label="Occupants in scope" value={filteredRows.length.toLocaleString()} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <TenantReportCard
          title="Paid tenants"
          description="Tenants whose current-period obligations are fully settled."
          emptyText="No tenants are fully paid yet."
          rows={paidRows}
        />
        <TenantReportCard
          title="Not fully paid"
          description="Tenants with partial, unpaid, overdue, or defaulted balances."
          emptyText="No open balances for this period."
          rows={notPaidRows}
        />
      </section>

      <section className="ios-panel rounded-[28px] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-950">
              Full tenant payment matrix
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Rating is based on current-period behavior: early full payment gets five stars.
            </p>
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
            {filteredRows.length} tenant{filteredRows.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-[0.12em] text-neutral-500">
                <th className="py-3 pr-4 font-semibold">Tenant</th>
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 text-right font-semibold">Expected</th>
                <th className="px-4 py-3 text-right font-semibold">Paid</th>
                <th className="py-3 pl-4 text-right font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredRows.map((row) => (
                <tr key={row.tenantId}>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-neutral-950">{row.tenantName}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {row.phone ?? row.email ?? "No contact added"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{row.unitLabel}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(row.paymentStatus)}`}>
                      {formatStatusLabel(row.paymentStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <Stars score={row.rating.score} />
                      <p className="text-xs text-neutral-500">{row.rating.label}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-900">
                    {formatLedgerCurrency(row.amountDue)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-900">
                    {formatLedgerCurrency(row.amountPaid)}
                  </td>
                  <td className="py-3 pl-4 text-right font-semibold text-neutral-950">
                    {formatLedgerCurrency(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRows.length === 0 ? (
            <div className="border-t border-neutral-100 py-8 text-center text-sm text-neutral-500">
              No occupants match this report filter.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ReportFilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-neutral-950 bg-neutral-950 text-white"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
      }`}
    >
      {children}
    </Link>
  );
}

function ReportStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Receipt;
  label: string;
  value: string;
}) {
  return (
    <div className="ios-card rounded-[24px] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutral-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-neutral-950">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-white">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
    </div>
  );
}

function TenantReportCard({
  title,
  description,
  emptyText,
  rows,
}: {
  title: string;
  description: string;
  emptyText: string;
  rows: Array<{
    tenantId: string;
    tenantName: string;
    unitLabel: string;
    paymentStatus: string;
    amountDue: number;
    amountPaid: number;
    balance: number;
    daysPastDue: number;
    rating: {
      score: number;
      label: string;
      detail: string;
    };
  }>;
}) {
  return (
    <section className="ios-panel rounded-[28px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
          {rows.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
            {emptyText}
          </div>
        ) : (
          rows.map((row) => (
            <article
              key={row.tenantId}
              className="rounded-2xl border border-neutral-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-950">
                    {row.tenantName}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">{row.unitLabel}</p>
                </div>
                <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${ratingTone(row.rating.score)}`}>
                  {row.rating.label}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <Stars score={row.rating.score} />
                  <p className="mt-1 text-xs text-neutral-500">{row.rating.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500">
                    {row.daysPastDue > 0 ? `${row.daysPastDue} days past due` : "Within period"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-950">
                    {formatLedgerCurrency(row.balance)} balance
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
