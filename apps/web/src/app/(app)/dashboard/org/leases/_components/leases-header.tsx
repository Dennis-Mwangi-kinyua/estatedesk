import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import type { OrgLeasesPageData } from "../_lib/types";

export function LeasesHeader({ data, orgRole }: { data: OrgLeasesPageData; orgRole?: OrgRole | null }) {
  return <header className="space-y-3">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{data.organizationName} · Tenancy records</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Your leases </h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Keep rental terms, agreements, and tenancy status together. Open a lease to manage its details.</p></div>
      <Link data-workspace-action="true" href="/dashboard/org/tenants/new" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"><span aria-hidden="true"><WorkspaceIcon label="staff" className="inline-block h-5 w-5 shrink-0 align-middle" /></span>Add tenant with lease</Link>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3"><InAppGuideHint topic="rent" workspace="org" orgRole={orgRole} /><Link href="/dashboard/org/tenants" className="inline-flex min-h-11 items-center text-sm font-medium text-primary">View tenants →</Link></div>
  </header>;
}
