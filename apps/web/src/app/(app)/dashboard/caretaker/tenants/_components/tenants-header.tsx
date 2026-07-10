import Link from "next/link";
import { FileText, Search, Users } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerTenantsPageData } from "../_lib/types";

export function TenantsHeader({
  data,
}: {
  data: Pick<
    CaretakerTenantsPageData,
    "totalTenants" | "activeTenants" | "query"
  >;
}) {
  return (
    <section className={panelShellClassName}>
      <div className={`${panelBodyClassName} space-y-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Field directory
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Tenants
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-[15px]">
              {data.activeTenants > 0
                ? `${data.activeTenants} active · ${data.totalTenants} in your assignment scope`
                : "Occupants linked to apartments under your care. Call, message, or open a profile from here."}
            </p>

            <div className="mt-3">
              <InAppGuideHint topic="caretaker" workspace="caretaker" />
            </div>
          </div>

          <Link
            href="/dashboard/caretaker/leases"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30 sm:h-10"
          >
            <FileText className="h-4 w-4" />
            Leases
          </Link>
        </div>

        <form
          action="/dashboard/caretaker/tenants"
          method="get"
          className="relative"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={data.query}
            placeholder="Search name, phone, unit, property…"
            className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-28 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            autoComplete="off"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Search
          </button>
        </form>
      </div>
    </section>
  );
}
