import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft, Building2, Home } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { UNITS_WORKFLOW_STEPS } from "../_lib/constants";
import type { UnitsPageData } from "../_lib/types";
import { panelShellClassName } from "./units-ui";

export function UnitsHeaderSection({
  data,
  orgRole,
}: {
  data: UnitsPageData;
  orgRole?: OrgRole | null;
}) {
  const { organizationName, totalUnits, vacantUnits, view } = data;
  const selectedProperty =
    view === "mixes" || view === "units" ? data.selectedProperty : null;
  const selectedMix = view === "units" ? data.selectedMix : null;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Home className="h-3.5 w-3.5" />
              Portfolio inventory
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Units
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {view === "units" && selectedProperty && selectedMix
                ? `Reviewing ${selectedMix.label} units at ${selectedProperty.name} for ${organizationName}.`
                : view === "mixes" && selectedProperty
                  ? `Browse unit mixes at ${selectedProperty.name} before opening occupied or vacant inventory.`
                  : `Browse properties, apartment mixes, and unit inventory for ${organizationName}.`}
            </p>

            {vacantUnits > 0 ? (
              <InAppGuideHint topic="vacancies" workspace="org" orgRole={orgRole} />
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <Link
              href="/dashboard/org"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <Link
              href="/dashboard/org/properties"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              View properties
            </Link>
            <Link
              href="/dashboard/org/buildings"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Building2 className="h-4 w-4" />
              View buildings
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-border px-5 py-5 sm:grid-cols-3 sm:px-6">
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Total units
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{totalUnits}</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Vacant units
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{vacantUnits}</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Portfolio scope
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">All properties</p>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
        {UNITS_WORKFLOW_STEPS.map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-border bg-muted/15 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {item.step}
              </span>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}