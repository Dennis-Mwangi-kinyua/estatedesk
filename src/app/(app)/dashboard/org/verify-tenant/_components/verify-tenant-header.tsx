import Link from "next/link";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import type { OrgRole } from "@prisma/client";

export function VerifyTenantHeader({ orgRole }: { orgRole?: OrgRole | null }) {
  return (
      <div className="rounded-[28px] ed-theme-card border border-border bg-card/90 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Verify Tenant
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-neutral-600">
              Search across tenant records from every organisation, then
              review lease, payment, and move-out history before onboarding.
            </p>
            <InAppGuideHint
              topic="portfolio"
              workspace="org"
              orgRole={orgRole}
            />
          </div>

          <Link
            href="/dashboard/org/tenants/new"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.99]"
          >
            Create tenant
          </Link>
        </div>
      </div>
  );
}
