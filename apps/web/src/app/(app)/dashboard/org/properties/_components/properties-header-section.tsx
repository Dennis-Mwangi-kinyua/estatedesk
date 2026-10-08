import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft, Plus } from "lucide-react";
import type { PropertiesPageData } from "../_lib/types";
export function PropertiesHeaderSection({ data }: { data: PropertiesPageData; orgRole?: OrgRole | null }) {
  return <header className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-7">
    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-primary/5" />
    <Link href="/dashboard/org" className="relative inline-flex min-h-11 items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Dashboard</Link>
    <div className="relative mt-2 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">{data.membership.org.name} · Portfolio</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Your properties <span aria-hidden="true" className="ml-1 inline-block align-middle text-3xl">🏘️</span></h1><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Every property, neatly in one place. Open a property to manage its buildings, units, and daily operations.</p></div>
      <Link href="/dashboard/org/properties/new" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"><Plus className="h-4 w-4" />Add property</Link>
    </div>
  </header>;
}
