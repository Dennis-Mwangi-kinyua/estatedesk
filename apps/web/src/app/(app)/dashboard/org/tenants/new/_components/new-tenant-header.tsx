import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export function NewTenantHeader({ orgName, availableUnitsCount }: { orgName: string; availableUnitsCount: number }) {
  return <header className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-6">
    <div aria-hidden="true" className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-primary/5" />
    <Link href="/dashboard/org/tenants" className="relative inline-flex min-h-11 items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Tenant directory</Link>
    <div className="relative mt-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">{orgName} · Tenant setup</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome a new tenant <span aria-hidden="true"><WorkspaceIcon label="tenant" className="inline-block h-5 w-5 shrink-0 align-middle" /></span></h1><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">A few simple steps to add their details, assign a home, and get their account ready.</p></div>
      <div className="inline-flex w-fit shrink-0 items-center gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3"><span aria-hidden="true" className="text-2xl"><WorkspaceIcon label="security" className="inline-block h-5 w-5 shrink-0 align-middle" /></span><div><p className="text-lg font-semibold tabular-nums">{availableUnitsCount}</p><p className="text-xs text-muted-foreground">{availableUnitsCount === 1 ? "Unit available" : "Units available"}</p></div></div>
    </div>
  </header>;
}
