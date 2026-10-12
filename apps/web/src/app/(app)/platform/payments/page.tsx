import Link from "@/components/navigation/workspace-link";
import { ArrowUpRight } from "lucide-react";
import { Search } from "@/components/shared/colored-icons";
import { PlatformSticker } from "../_components/platform-sticker";
import {
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
import { PageHeader, PaginationControls, StatCard } from "../_components/control-plane";

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
      <PageHeader
        eyebrow="Platform ledger"
        title="Organisation payments"
        description={`Collection overview for ${ledger.period}. Review recorded payments and outstanding balances, then open an organisation for its full account.`}
        action={<Link data-workspace-action="true" href="/platform/payment-ops" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Payment operations<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>}
      />

      <section aria-label="Payment overview" className="grid min-w-0 grid-cols-1 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organisations" value={ledger.totals.organizations} note="All matching organisations" />
        <StatCard
          label="With payments"
          value={ledger.totals.paidOrganizations}
          note="On this page"
        />
        <StatCard
          label="Recorded payments"
          value={formatLedgerCurrency(ledger.totals.paid)}
          note="On this page"
        />
        <StatCard
          label="Outstanding balance"
          value={formatLedgerCurrency(ledger.totals.deficit)}
          note="On this page"
        />
      </section>

      <section className="min-w-0 max-w-full overflow-hidden workspace-panel rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-3 text-base font-semibold text-foreground"><PlatformSticker label="Organisations" />Organisation accounts</h2>
          <p className="mt-1 text-xs text-muted-foreground">{ledger.totals.listedOrganizations} on this page · Open an organisation to view its operations.</p>
        </div>

        <form className="grid gap-3 border-b border-border p-4 sm:grid-cols-[1fr_auto]">
          <label className="min-w-0 text-sm font-medium">Find an organisation<div className="relative mt-2"><Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input name="q" defaultValue={q} maxLength={200} placeholder="Organisation name or slug" className="min-h-11 w-full rounded-xl border border-border bg-card py-3 pl-10 pr-3 text-base font-normal sm:text-sm" /></div></label>
          <button data-workspace-action="true" className="min-h-11 self-end rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            Apply
          </button>
        </form>

        {ledger.rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No organizations found.
          </p>
        ) : (
          <ResponsiveDataList
            desktopBreakpoint="2xl"
            className="min-w-0 max-w-full"
            mobile={
              <ul className="grid min-w-0 gap-4 bg-muted/20 p-3 sm:grid-cols-2 sm:p-4">
                {ledger.rows.map((row) => (
                  <li key={row.orgId} className="min-w-0">
                    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <PlatformSticker label="Organisation" className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <Link href={`/platform/organizations/${encodeURIComponent(row.slug)}`}
                            className="group inline-flex min-h-11 max-w-full items-center gap-2 break-words text-sm font-semibold text-foreground hover:text-primary focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-primary">
                            <span className="min-w-0 break-words">{row.name}</span><ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                          </Link>
                          <p className="break-all text-xs text-muted-foreground">/{row.slug}</p>
                        </div>
                      </div>
                      <dl className="my-4 grid min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                        <div className="min-w-0 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                          <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><PlatformSticker label="Payments" size="xs" />Recorded payments</dt>
                          <dd className="mt-2 break-words text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{formatLedgerCurrency(row.paid)}</dd>
                        </div>
                        <div className="min-w-0 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                          <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><PlatformSticker label="Balance" size="xs" />Outstanding</dt>
                          <dd className="mt-2 break-words text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-300">{formatLedgerCurrency(row.deficit)}</dd>
                        </div>
                      </dl>
                      <dl className="mt-auto space-y-3 border-t border-border pt-4">
                        <DataCardRow label="Tenants" value={row.tenantCount} />
                        <DataCardRow
                          label="Expected"
                          value={formatLedgerCurrency(row.expected)}
                        />
                        <DataCardRow label="Payments" value={row.paymentCount} />
                        <DataCardRow
                          label="Last payment"
                          value={formatLedgerDate(row.lastPaymentAt)}
                        />
                      </dl>
                    </article>
                  </li>
                ))}
              </ul>
            }
            desktop={
              <table className="min-w-full text-sm [&_td]:tabular-nums">
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
