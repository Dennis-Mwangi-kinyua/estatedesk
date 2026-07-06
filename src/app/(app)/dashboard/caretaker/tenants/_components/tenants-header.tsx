import Link from "next/link";
import { FileText, Users } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerTenantsPageData } from "../_lib/types";

export function TenantsHeader({
  data,
}: {
  data: Pick<CaretakerTenantsPageData, "totalTenants" | "activeTenants">;
}) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Field operations
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Tenants
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {data.activeTenants > 0
                ? `${data.activeTenants} active tenant${data.activeTenants === 1 ? "" : "s"} across ${data.totalTenants} assigned record${data.totalTenants === 1 ? "" : "s"}.`
                : "Tenant records for apartments and units under your care."}
            </p>

            <InAppGuideHint topic="caretaker" workspace="caretaker" />
          </div>

          <Link
            href="/dashboard/caretaker/leases"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            <FileText className="h-4 w-4" />
            Leases
          </Link>
        </div>
      </div>
    </section>
  );
}