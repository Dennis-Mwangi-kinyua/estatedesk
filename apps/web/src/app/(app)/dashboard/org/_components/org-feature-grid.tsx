"use client";

import { useMemo, useState } from "react";
import Link, { useWorkspaceAccess } from "@/components/navigation/workspace-link";
import { canDiscoverWorkspaceHref } from "@/lib/permissions/workspace-access";
import type { MobileWorkspaceLink } from "@estatedesk/contracts/mobile";

export function OrgFeatureGrid({ features }: { features: MobileWorkspaceLink[] }) {
  const access = useWorkspaceAccess();
  const [query, setQuery] = useState("");
  const cards = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return features.filter(feature => (!access || canDiscoverWorkspaceHref(access, feature.path)) && (!needle || `${feature.title} ${feature.description} ${feature.group}`.toLowerCase().includes(needle)));
  }, [features, query, access]);
  return <section aria-labelledby="org-features-heading" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 id="org-features-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">All EstateDesk features</h2><p className="mt-1 text-sm text-muted-foreground">Your organization tools, arranged in one grid.</p></div>
      <label className="w-full sm:w-80"><span className="sr-only">Search organization features</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search any feature…" className="min-h-12 w-full rounded-xl border border-border bg-card px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary" /></label>
    </div>
    <p role="status" className="text-xs text-muted-foreground">{cards.length} {query ? "matching" : "available"} features</p>
    <div className="grid auto-rows-fr grid-cols-2 gap-2.5 min-[420px]:grid-cols-3 sm:gap-3 lg:grid-cols-4 2xl:grid-cols-5">
      {cards.map((feature, index) => <Link key={feature.path} href={feature.path} prefetch={false} aria-label={feature.title} className="group flex min-h-40 min-w-0 flex-col gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-48 sm:gap-3 sm:p-4 xl:p-5">
        <span aria-hidden="true" className={`flex size-10 items-center justify-center rounded-xl text-2xl sm:size-12 sm:rounded-2xl sm:text-3xl ${["bg-emerald-500/10", "bg-blue-500/10", "bg-amber-500/10", "bg-purple-500/10"][index % 4]}`}>{feature.emoji}</span>
        <h3 className="break-words text-sm font-semibold leading-5 sm:text-base">{feature.title}</h3>
        <p className="break-words text-[11px] leading-4 text-muted-foreground sm:text-xs">{feature.group}</p>
        <p className="hidden text-sm leading-5 text-muted-foreground sm:block">{feature.description}</p>
        <span aria-hidden="true" className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs font-semibold text-primary">Open<span className="text-lg">→</span></span>
      </Link>)}
    </div>
    {cards.length === 0 ? <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">No features match your search. Try another name.</p> : null}
  </section>;
}
