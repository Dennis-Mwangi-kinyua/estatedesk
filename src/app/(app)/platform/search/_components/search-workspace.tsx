import { Search } from "lucide-react";
import {
  PageHeader,
  StatCard,
  Surface,
  formatNumber,
} from "../../_components/control-plane";
import type { getGlobalSearchResults } from "../_lib/queries";
import { SearchResultsSection } from "./search-results-section";

const SEARCH_TIPS = [
  "Organization name, slug, email, or phone",
  "User full name, email, username, or phone",
  "Tenant name, phone, national ID, or KRA PIN",
  "Payment reference, checkout ID, or payer phone",
  "Unit house number or property name",
];

export function SearchWorkspace({
  q,
  data,
}: {
  q: string;
  data: Awaited<ReturnType<typeof getGlobalSearchResults>>;
}) {
  const totalMatches =
    data.orgs.length +
    data.users.length +
    data.tenants.length +
    data.payments.length +
    data.units.length;

  const orgRows = data.orgs.map((org) => ({
    id: org.id,
    primary: org.name,
    secondary: `/${org.slug}`,
    status: org.status,
    href: `/platform/organizations/${org.slug}`,
    date: org.updatedAt,
  }));

  const userRows = data.users.map((user) => ({
    id: user.id,
    primary: user.fullName,
    secondary: user.email ?? user.username ?? user.phone ?? "—",
    status: user.platformRole,
    href: `/platform/users/${user.username ?? user.id}`,
    date: user.updatedAt,
  }));

  const tenantRows = data.tenants.map((tenant) => ({
    id: tenant.id,
    primary: tenant.fullName,
    secondary: `${tenant.org.name} · ${tenant.phone}`,
    status: tenant.status,
    href: `/platform/organizations/${tenant.org.slug}`,
    date: tenant.updatedAt,
  }));

  const paymentRows = data.payments.map((payment) => ({
    id: payment.id,
    primary:
      payment.reference ??
      payment.externalReference ??
      payment.checkoutRequestId ??
      payment.id,
    secondary: `${payment.org.name} · ${payment.targetType} · KES ${Number(payment.amount).toLocaleString("en-KE")}`,
    status: payment.gatewayStatus,
    href: `/platform/organizations/${payment.org.slug}`,
    date: payment.createdAt,
  }));

  const unitRows = data.units.map((unit) => ({
    id: unit.id,
    primary: `Unit ${unit.houseNo}`,
    secondary: `${unit.property.org.name} · ${unit.property.name}`,
    status: unit.status,
    href: `/platform/organizations/${unit.property.org.slug}`,
    date: unit.updatedAt,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Global search"
        title="Search the platform"
        description="Find organizations, users, tenants, payment references, phone numbers, and units from one place."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] xl:items-start">
        <aside className="space-y-4 xl:sticky xl:top-4">
          <Surface title="Search tips" description="Use at least 2 characters.">
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {SEARCH_TIPS.map((tip) => (
                <li
                  key={tip}
                  className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300"
                >
                  {tip}
                </li>
              ))}
            </ul>
          </Surface>
        </aside>

        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
            <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-slate-900">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  id="q"
                  name="q"
                  defaultValue={q}
                  placeholder="Name, email, phone, receipt, unit, slug..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                />
              </div>
              <button className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                Search
              </button>
            </form>

            {!data.hasQuery ? (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                Enter at least 2 characters to search.
              </p>
            ) : null}
          </section>

          {data.hasQuery ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Organizations" value={formatNumber(data.orgs.length)} />
                <StatCard label="Users" value={formatNumber(data.users.length)} />
                <StatCard label="Tenants" value={formatNumber(data.tenants.length)} />
                <StatCard label="Payments" value={formatNumber(data.payments.length)} />
                <StatCard label="Units" value={formatNumber(data.units.length)} />
              </section>

              <Surface
                title="Results"
                description={
                  totalMatches === 0
                    ? `No matches for “${q}”`
                    : `${formatNumber(totalMatches)} matches for “${q}”`
                }
              >
                {totalMatches === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-300">
                    Try a different name, phone number, payment reference, or slug.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-white/10">
                    <SearchResultsSection
                      title="Organizations"
                      count={data.orgs.length}
                      rows={orgRows}
                    />
                    <SearchResultsSection
                      title="Users"
                      count={data.users.length}
                      rows={userRows}
                    />
                    <SearchResultsSection
                      title="Tenants"
                      count={data.tenants.length}
                      rows={tenantRows}
                    />
                    <SearchResultsSection
                      title="Payments"
                      count={data.payments.length}
                      rows={paymentRows}
                    />
                    <SearchResultsSection
                      title="Units"
                      count={data.units.length}
                      rows={unitRows}
                    />
                  </div>
                )}
              </Surface>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}