import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft, Home, Plus } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { PROPERTIES_WORKFLOW_STEPS } from "../_lib/constants";
import type { PropertiesPageData } from "../_lib/types";
import { panelShellClassName } from "./properties-ui";

export function PropertiesHeaderSection({
  data,
  orgRole,
}: {
  data: PropertiesPageData;
  orgRole?: OrgRole | null;
}) {
  const { membership, overallProperties, totalBuildingsAggregate, totalUnitsAggregate } =
    data;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Home className="h-3.5 w-3.5" />
              Property management
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Property portfolio
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Manage all properties under {membership.org.name}. Review portfolio
              coverage, water billing defaults, linked taxpayer profiles, and the number
              of buildings and units assigned to each property.
            </p>

            <InAppGuideHint topic="portfolio" workspace="org" orgRole={orgRole} />
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
              href="/dashboard/org/properties/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New property
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-border px-5 py-5 sm:grid-cols-3 sm:px-6">
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Total properties
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {overallProperties}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Buildings
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {totalBuildingsAggregate}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Units
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {totalUnitsAggregate}
          </p>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
        {PROPERTIES_WORKFLOW_STEPS.map((item) => (
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