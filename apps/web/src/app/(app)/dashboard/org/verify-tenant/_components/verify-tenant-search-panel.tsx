import Link from "next/link";
import { TenantVerificationSearchForm } from "./tenant-verification-search-form";
import type { VerifyTenantPageData } from "../_lib/types";

export function VerifyTenantSearchPanel({ search, canSearch, results, currentOrgResults, otherOrgResults, hasResults }: Pick<VerifyTenantPageData, "search" | "canSearch" | "results" | "currentOrgResults" | "otherOrgResults" | "hasResults">) {
  return <div className="space-y-4">
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6" aria-labelledby="tenant-search-heading">
      <h2 id="tenant-search-heading" className="text-base font-semibold text-foreground">Search tenant records</h2>
      <p id="tenant-search-help" className="mt-1 text-sm leading-6 text-muted-foreground">Use a phone number, email, national ID, KRA PIN, or name. Enter at least 3 characters.</p>
      <TenantVerificationSearchForm search={search} />
      {search && !canSearch && <p role="alert" className="mt-3 text-sm text-amber-700 dark:text-amber-300">Enter at least 3 characters to verify a tenant.</p>}
    </section>
    {canSearch && <div className="grid grid-cols-3 gap-2 sm:gap-3">{[{icon:"🔎",label:"Matches",value:results.length},{icon:"🏡",label:"Your organisation",value:currentOrgResults.length},{icon:"🌍",label:"Other organisations",value:otherOrgResults.length}].map(item=><div key={item.label} className="min-w-0 rounded-2xl border border-border bg-card p-3 sm:p-4"><span aria-hidden="true" className="text-xl">{item.icon}</span><p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.label}</p></div>)}</div>}
    {!search && <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center sm:p-8"><span aria-hidden="true" className="text-4xl">🪪</span><h2 className="mt-3 text-base font-semibold text-foreground">Start with their details</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Search above to find matching records and review leases, payment records, and move-out history.</p></div>}
    {canSearch && !hasResults && <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center sm:p-8"><span aria-hidden="true" className="text-4xl">📭</span><h2 className="mt-3 text-base font-semibold text-foreground">No matching records</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Check the spelling or try another identifier. You can add a new tenant once their details are confirmed.</p><Link href="/dashboard/org/tenants/new" className="mt-4 inline-flex min-h-12 items-center rounded-xl border border-border px-5 text-sm font-semibold text-foreground">Add a new tenant</Link></div>}
  </div>;
}
