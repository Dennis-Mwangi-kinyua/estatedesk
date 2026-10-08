import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import { DeferredLink } from "@/components/navigation/app-links";
import { ArrowUpRight, ChevronDown, MapPin } from "lucide-react";
import type { PropertiesPageData } from "../_lib/types";
import { formatDate, formatMoney, formatPropertyType } from "../_lib/helpers";
import { PropertyStatusPill } from "./properties-ui";
const stickers: Record<string, string> = { RESIDENTIAL: "🏡", COMMERCIAL: "🏢", MIXED_USE: "🏙️", GODOWN: "📦" };
export function PropertiesItemsSection({ data }: { data: PropertiesPageData }) {
  return <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {data.properties.map(property => <article key={property.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3 bg-muted/25 p-5 pb-4">
        <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-2xl shadow-sm">{stickers[property.type] || "🏘️"}</span>
        <PropertyStatusPill active={property.isActive} />
      </div>
      <div className="flex flex-1 flex-col p-5 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{formatPropertyType(property.type)}</p>
        <h3 className="mt-1 break-words text-lg font-semibold leading-6"><DeferredLink href={`/dashboard/org/properties/${property.id}`} className="text-foreground hover:text-primary">{property.name}</DeferredLink></h3>
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="break-words">{property.location || property.address || "Location not added"}</span></p>
        <dl className="mt-5 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-muted/15 py-3">
          {[{label:"Buildings", value:property._count.buildings, emoji:"🏢"},{label:"Units",value:property._count.units,emoji:"🚪"},{label:"Issues",value:property._count.issues,emoji:"🛠️"}].map(stat => <div key={stat.label} className="min-w-0 text-center"><dt className="text-[10px] font-medium text-muted-foreground"><span aria-hidden="true"><WorkspaceIcon label={stat.label} className="inline-block h-4 w-4" /></span> {stat.label}</dt><dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">{stat.value}</dd></div>)}
        </dl>
        <details className="mt-4 text-xs text-muted-foreground">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-medium text-foreground">Billing & property details<ChevronDown className="h-4 w-4" /></summary>
          <dl className="space-y-3 border-t border-border pt-3">
            <div><dt className="font-medium text-foreground">Address</dt><dd className="mt-1 break-words">{property.address || "Not added"}</dd></div>
            <div><dt className="font-medium text-foreground">Water billing</dt><dd className="mt-1">{formatMoney(property.waterRatePerUnit?.toString(), data.membership.org.currencyCode)} / unit · {formatMoney(property.waterFixedCharge?.toString(), data.membership.org.currencyCode)} fixed</dd></div>
            <div><dt className="font-medium text-foreground">Taxpayer profile</dt><dd className="mt-1 break-words">{property.taxpayerProfile ? `${property.taxpayerProfile.displayName} · PIN ${property.taxpayerProfile.kraPin} · ${property.taxpayerProfile.kind}` : "Not linked"}</dd></div>
            {property.notes ? <div><dt className="font-medium text-foreground">Notes</dt><dd className="mt-1 whitespace-pre-wrap break-words">{property.notes}</dd></div> : null}
            <div><dt className="font-medium text-foreground">Added</dt><dd className="mt-1">{formatDate(property.createdAt)}</dd></div>
          </dl>
        </details>
        <DeferredLink href={`/dashboard/org/properties/${property.id}`} aria-label={`View ${property.name}`} className="mt-4 flex min-h-11 items-center justify-between rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition group-hover:border-primary/20 hover:bg-primary/5">View property<ArrowUpRight className="h-4 w-4 text-primary" /></DeferredLink>
      </div>
    </article>)}
  </div>;
}
