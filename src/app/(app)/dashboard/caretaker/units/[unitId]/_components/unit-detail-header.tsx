import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerUnitDetailPageData } from "../_lib/types";

export function UnitDetailHeader({
  data,
}: {
  data: Extract<CaretakerUnitDetailPageData, { ok: true }>;
}) {
  const { unit, activeLease } = data;
  const location = [
    unit.property.name,
    unit.building?.name,
    unit.property.location,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <Link
          href="/dashboard/caretaker/units"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to units
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm text-muted-foreground">Unit profile</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              House {unit.houseNo}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {location}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeLease
                ? `Tenant: ${activeLease.tenant.fullName}`
                : "No active tenant on this unit"}
            </p>
          </div>

          <span className="inline-flex h-fit rounded-full border border-border bg-muted/20 px-3 py-1.5 text-xs font-semibold capitalize text-muted-foreground">
            {unit.status.toLowerCase()}
          </span>
        </div>
      </div>
    </section>
  );
}