"use client";

import { useState } from "react";
import { LoaderCircle, Search } from "lucide-react";

export function TenantVerificationSearchForm({ search }: { search: string }) {
  const [searching, setSearching] = useState(false);
  return (
      <form method="get" action="/dashboard/org/verify-tenant" onSubmit={()=>setSearching(true)} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative min-w-0"><label htmlFor="tenant-search" className="sr-only">Tenant details</label><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-muted-foreground"/><input id="tenant-search" type="search" name="q" required minLength={3} defaultValue={search} aria-describedby="tenant-search-help" placeholder="Phone, email, ID, PIN or name" className="h-12 w-full min-w-0 rounded-xl border border-border bg-background pl-12 pr-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15" /></div>
        <button type="submit" disabled={searching} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70">{searching ? <><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none"/>Searching…</> : <><Search aria-hidden="true" className="h-4 w-4"/>Verify tenant</>}</button>
      </form>
  );
}
