import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import { DeferredLink } from "@/components/navigation/app-links";
import { getOrgUnitHref } from "@/lib/units/url";
import { formatCurrency, formatDate } from "../_lib/helpers";
import type { OrgLeasesPageData } from "../_lib/types";
import { LeasesEmptyState } from "./leases-empty-state";
import { LeaseStatusPill, panelShellClassName } from "./leases-ui";
import { LeasesPagination } from "./leases-pagination";

export function LeasesDirectorySection({ data }: { data: OrgLeasesPageData }) {
  const { leases, currentPage, totalPages, showingFrom, showingTo, totalLeases } = data;
  return <section className="space-y-4" aria-labelledby="leases-directory-heading">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 id="leases-directory-heading" className="text-lg font-semibold text-foreground">Lease directory</h2><p className="mt-1 text-sm text-muted-foreground">{totalLeases === 0 ? "Your tenancy records will appear here." : `Showing ${showingFrom}–${showingTo} of ${totalLeases} leases`}</p></div><span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">Newest first</span></div>
    {leases.length === 0 ? <div className={panelShellClassName}><LeasesEmptyState /></div> : <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{leases.map(lease => {
        const href = `/dashboard/org/leases/${lease.id}`;
        const currency = lease.org.currencyCode ?? "KES";
        return <article key={lease.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md">
          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2"><span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-2xl"><WorkspaceIcon label="document" className="inline-block h-5 w-5 shrink-0 align-middle" /></span><LeaseStatusPill status={lease.status}/></div>
            <div><h3 className="break-words text-lg font-semibold text-foreground"><DeferredLink href={`/dashboard/org/tenants/${lease.tenant.id}`} className="transition hover:text-primary">{lease.tenant.fullName}</DeferredLink></h3><p className="mt-1 text-xs text-muted-foreground">Lease #{lease.id.slice(0,8)}</p></div>
            <div className="space-y-2 rounded-xl border border-border bg-muted/15 p-3"><p className="break-words text-sm"><span aria-hidden="true"><WorkspaceIcon label="properties" className="inline-block h-5 w-5 shrink-0 align-middle" /> </span><DeferredLink href={`/dashboard/org/properties/${lease.unit.property.id}`} className="font-medium text-foreground hover:text-primary">{lease.unit.property.name}</DeferredLink></p><p className="break-words text-sm text-muted-foreground">{lease.unit.building ? `${lease.unit.building.name} · ` : "Standalone · "}<DeferredLink href={getOrgUnitHref({id:lease.unit.id,houseNo:lease.unit.houseNo,buildingName:lease.unit.building?.name,propertyName:lease.unit.property.name})} className="font-medium text-foreground hover:text-primary">Unit {lease.unit.houseNo}</DeferredLink></p></div>
            <dl className="grid grid-cols-2 gap-3"><div><dt className="text-xs text-muted-foreground">Monthly rent</dt><dd className="mt-1 break-words text-base font-semibold text-foreground">{formatCurrency(lease.monthlyRent,currency)}</dd></div><div><dt className="text-xs text-muted-foreground">Deposit</dt><dd className="mt-1 break-words text-base font-semibold text-foreground">{formatCurrency(lease.deposit,currency)}</dd></div><div><dt className="text-xs text-muted-foreground">Starts</dt><dd className="mt-1 text-sm font-medium text-foreground">{formatDate(lease.startDate)}</dd></div><div><dt className="text-xs text-muted-foreground">Ends</dt><dd className="mt-1 text-sm font-medium text-foreground">{lease.endDate ? formatDate(lease.endDate) : "No end date"}</dd></div></dl>
            <details className="rounded-xl border border-border px-3"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-foreground">More lease details ↓</summary><dl className="space-y-3 border-t border-border py-3 text-sm"><div><dt className="text-xs text-muted-foreground">Rent due day</dt><dd className="mt-1 text-foreground">Day {lease.dueDay} each month</dd></div><div><dt className="text-xs text-muted-foreground">Caretaker</dt><dd className="mt-1 break-words text-foreground">{lease.caretaker ? <DeferredLink href={`/staff/${lease.caretaker.id}`} className="hover:text-primary">{lease.caretaker.fullName}</DeferredLink> : "Not assigned"}</dd></div><div><dt className="text-xs text-muted-foreground">Uploaded contract</dt><dd className="mt-1 break-words text-foreground">{lease.contractDocument?.fileName ?? "No uploaded contract"}</dd></div></dl></details>
          </div>
          <div className="mt-auto border-t border-border p-4 sm:px-5"><DeferredLink href={href} aria-label={`View lease for ${lease.tenant.fullName}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:bg-primary/15">View lease & agreement <span aria-hidden="true">→</span></DeferredLink></div>
        </article>;
      })}</div>
      <LeasesPagination currentPage={currentPage} totalPages={totalPages} showingFrom={showingFrom} showingTo={showingTo} totalLeases={totalLeases}/>
    </>}
  </section>;
}
