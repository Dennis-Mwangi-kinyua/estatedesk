import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { WorkspaceHero } from "@/components/shared/workspace-hero";
import {
  DataCard,
  DataCardRow,
  ResponsiveDataList,
} from "@/components/ui/responsive-data-list";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { getPagination } from "@/lib/db/pagination";
import {
  formatLedgerCurrency,
  formatLedgerDate,
  getPlatformPaymentLedger,
} from "@/lib/ledger";
import { PaginationControls, StatCard } from "../_components/control-plane";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
}>;

export default async function PlatformPaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 200);
  const { page, pageSize, skip, take } = getPagination({
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 20),
  });
  let ledger: Awaited<ReturnType<typeof getPlatformPaymentLedger>>;
  try {
    ledger = await getPlatformPaymentLedger(undefined, { skip, take, q });
  } catch (error) {
    const failure = error as { code?: string; name?: string };
    console.error("[platform.payment-ledger]", { code: failure?.code ?? "unknown", name: failure?.name ?? "unknown" });
    const retryParams = new URLSearchParams({ page: String(page), pageSize: String(pageSize), ...(q ? { q } : {}) });
    return <section className="workspace-panel rounded-2xl border border-border bg-card p-6 text-foreground">
      <p className="text-sm text-muted-foreground">Platform ledger</p>
      <h1 className="mt-2 text-2xl font-semibold">Organization payments</h1>
      <div role="alert" className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
        <h2 className="font-semibold">Payment ledger is temporarily unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">Billing and payment data could not be loaded. Totals will appear once the database connection is restored.</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/platform/payments?${retryParams}`} className="rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground">Retry ledger</Link>
        <Link href="/platform/system-health" className="rounded-xl border border-border px-4 py-3 font-medium">Check system health</Link>
      </div>
    </section>;
  }

  return (
    <div className="ed-mobile-first min-w-0 max-w-full space-y-4 overflow-x-clip sm:space-y-6">
      <div className="workspace-panel overflow-hidden rounded-3xl border border-border bg-card">
        <WorkspaceHero kind="payments" eyebrow="Platform ledger" title="Organisation payments" description={`Collection visibility for ${ledger.period}. Review billing, payments, and outstanding balances across your organisations.`} actions={<Link href="/platform/payment-ops" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Review payment operations<ArrowUpRight className="h-4 w-4" /></Link>}>
          <p className="text-xs text-muted-foreground">Select an organisation below to explore its profile, billing, members, and operational activity.</p>
        </WorkspaceHero>
      </div>

      <section className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
        <StatCard label="Organizations" value={ledger.totals.organizations} />
        <StatCard
          label="Organisations with payments"
          value={ledger.totals.paidOrganizations}
          note="Current page"
        />
        <StatCard
          label="Recorded payments"
          value={formatLedgerCurrency(ledger.totals.paid)}
          note="Current page"
        />
        <StatCard
          label="Outstanding balance"
          value={formatLedgerCurrency(ledger.totals.deficit)}
          note="Current page"
        />
      </section>

      <section className="min-w-0 max-w-full overflow-hidden workspace-panel rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">Organisations</h2>
          <p className="mt-1 text-xs text-muted-foreground">{ledger.totals.listedOrganizations} on this page · Open an organisation to view its operations.</p>
        </div>

        <form className="grid gap-3 border-b border-border p-4 sm:grid-cols-[1fr_auto]">
          <label className="min-w-0 text-sm font-medium">Find an organisation<div className="relative mt-2"><Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input name="q" defaultValue={q} maxLength={200} placeholder="Organisation name or slug" className="min-h-11 w-full rounded-xl border border-border bg-card py-3 pl-10 pr-3 text-base font-normal sm:text-sm" /></div></label>
          <button className="min-h-11 self-end rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            Apply
          </button>
        </form>

        {ledger.rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No organizations found.
          </p>
        ) : (
          <ResponsiveDataList
            className="min-w-0 max-w-full"
            mobile={
              <ul className="min-w-0 divide-y divide-border overflow-hidden">
                {ledger.rows.map((row) => (
                  <li key={row.orgId}>
                    <DataCard>
                      <Link
                        href={`/platform/organizations/${encodeURIComponent(row.slug)}`}
                        className="group inline-flex min-h-11 max-w-full items-center gap-2 break-words text-sm font-semibold text-primary underline underline-offset-4 hover:decoration-2"
                      >
                        {row.name}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
                      </Link>
                      <p className="mt-0.5 break-all text-xs text-muted-foreground">/{row.slug}</p>
                      <dl className="mt-2.5 space-y-1.5 rounded-xl border border-border bg-muted/30 p-2.5">
                        <DataCardRow label="Tenants" value={row.tenantCount} />
                        <DataCardRow
                          label="Expected"
                          value={formatLedgerCurrency(row.expected)}
                        />
                        <DataCardRow
                          label="Paid"
                          value={formatLedgerCurrency(row.paid)}
                        />
                        <DataCardRow
                          label="Deficit"
                          value={formatLedgerCurrency(row.deficit)}
                        />
                        <DataCardRow label="Payments" value={row.paymentCount} />
                        <DataCardRow
                          label="Last payment"
                          value={formatLedgerDate(row.lastPaymentAt)}
                        />
                      </dl>
                    </DataCard>
                  </li>
                ))}
              </ul>
            }
            desktop={
              <table className="min-w-full text-sm">
                <thead className="bg-muted/30 text-left text-muted-foreground">
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
                    <tr key={row.orgId} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Link
                          href={`/platform/organizations/${encodeURIComponent(row.slug)}`}
                          className="group inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4 hover:decoration-2"
                        >
                          {row.name}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          /{row.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.tenantCount}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatLedgerCurrency(row.expected)}
                      </td>
                      <td className="px-4 py-3 font-medium text-emerald-700 dark:text-emerald-300">
                        {formatLedgerCurrency(row.paid)}
                      </td>
                      <td className="px-4 py-3 font-medium text-amber-700 dark:text-amber-300">
                        {formatLedgerCurrency(row.deficit)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.paymentCount}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatLedgerDate(row.lastPaymentAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />
        )}

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
