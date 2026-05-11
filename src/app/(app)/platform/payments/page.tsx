import Link from "next/link";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { getPagination } from "@/lib/db/pagination";
import {
  formatLedgerCurrency,
  formatLedgerDate,
  getPlatformPaymentLedger,
} from "@/lib/ledger";
import { PaginationControls } from "../_components/control-plane";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
}>;

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

export default async function PlatformPaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const { page, pageSize, skip, take } = getPagination({
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 20),
  });
  const ledger = await getPlatformPaymentLedger(undefined, { skip, take, q });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
          Platform ledger
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
          Organization payments
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
          Monthly collection visibility across organizations for {ledger.period}.
          See who has recorded payments, expected tenant billing, and deficits.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organizations" value={ledger.totals.organizations} />
        <StatCard
          label="Listed paid"
          value={ledger.totals.paidOrganizations}
          note="Current page"
        />
        <StatCard
          label="Recorded paid"
          value={formatLedgerCurrency(ledger.totals.paid)}
        />
        <StatCard
          label="Total deficit"
          value={formatLedgerCurrency(ledger.totals.deficit)}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base font-semibold text-neutral-950">
            Organizations
          </h2>
        </div>

        <form className="grid gap-3 border-b border-neutral-200 p-4 sm:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search organization or slug"
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none"
          />
          <button className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white">
            Apply
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Tenants</th>
                <th className="px-4 py-3 font-medium">Expected</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Deficit</th>
                <th className="px-4 py-3 font-medium">Payments</th>
                <th className="px-4 py-3 font-medium">Last payment</th>
              </tr>
            </thead>
            <tbody>
              {ledger.rows.map((row) => (
                <tr key={row.orgId} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/platform/organizations/${row.orgId}`}
                      className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
                    >
                      {row.name}
                    </Link>
                    <p className="mt-1 text-xs text-neutral-500">/{row.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{row.tenantCount}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatLedgerCurrency(row.expected)}
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-700">
                    {formatLedgerCurrency(row.paid)}
                  </td>
                  <td className="px-4 py-3 font-medium text-red-700">
                    {formatLedgerCurrency(row.deficit)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{row.paymentCount}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatLedgerDate(row.lastPaymentAt)}
                  </td>
                </tr>
              ))}
              {ledger.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    No organizations found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={ledger.totals.organizations}
          basePath="/platform/payments"
          query={{ q }}
        />
      </section>
    </div>
  );
}
