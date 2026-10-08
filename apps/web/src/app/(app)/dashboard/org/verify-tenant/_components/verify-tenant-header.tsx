import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import Link from "next/link";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import type { OrgRole } from "@prisma/client";

export function VerifyTenantHeader({ orgRole }: { orgRole?: OrgRole | null }) {
  return <header className="space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tenant records</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Know your tenant </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Find a tenant and review their recorded rental history before onboarding.</p>
      </div>
      <Link data-workspace-action="true" href="/dashboard/org/tenants/new" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Add tenant <span aria-hidden="true" className="ml-2"><WorkspaceIcon label="tenant" className="inline-block h-5 w-5 shrink-0 align-middle" /></span></Link>
    </div>
    <ol aria-label="Verification process" className="grid grid-cols-3 gap-2 sm:gap-3">{[{icon:"🔎",title:"Find a record",text:"Search tenant details"},{icon:"📋",title:"Review history",text:"Leases and payments"},{icon:"🤝",title:"Next steps",text:"Onboard or transfer"}].map((item,index)=><li key={item.title} className="rounded-2xl border border-border bg-card p-3 sm:p-4"><span aria-hidden="true" className="text-2xl"><WorkspaceIcon label={item.title} /></span><p className="mt-2 text-xs font-semibold text-foreground sm:text-sm">{index+1}. {item.title}</p><p className="mt-1 hidden text-xs text-muted-foreground sm:block">{item.text}</p></li>)}</ol>
    <InAppGuideHint topic="portfolio" workspace="org" orgRole={orgRole} />
  </header>;
}
