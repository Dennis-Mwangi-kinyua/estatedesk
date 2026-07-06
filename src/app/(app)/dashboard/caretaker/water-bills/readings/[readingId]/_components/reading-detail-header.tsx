import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { StatusBadge } from "@/app/(app)/dashboard/caretaker/water-bills/_components/water-bills-ui";
import { readingStatusTone } from "../_lib/helpers";
import type { CaretakerReadingDetailPageData } from "../_lib/types";

export function ReadingDetailHeader({
  data,
}: {
  data: Extract<CaretakerReadingDetailPageData, { ok: true }>;
}) {
  const { reading } = data;

  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <Link
          href="/dashboard/caretaker/water-bills"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to water bills
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm text-muted-foreground">Meter reading</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              House {reading.unit.houseNo}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {reading.unit.property.name} ·{" "}
              {reading.unit.building?.name ?? "No building"} ·{" "}
              {reading.unit.leases[0]?.tenant.fullName ?? "No tenant assigned"}
            </p>
          </div>

          <StatusBadge
            label={reading.status}
            tone={readingStatusTone(reading.status)}
          />
        </div>
      </div>
    </section>
  );
}