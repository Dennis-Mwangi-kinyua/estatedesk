import Link from "next/link";
import { ArrowLeft, Droplets } from "lucide-react";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { buildReadPageHref } from "../../_lib/helpers";

type MeterEntryHeaderProps = {
  period: string;
  houseNo: string;
  propertyName: string;
  buildingName: string | null;
  tenantName: string;
};

export function MeterEntryHeader({
  period,
  houseNo,
  propertyName,
  buildingName,
  tenantName,
}: MeterEntryHeaderProps) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <Link
          href={buildReadPageHref(period)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to meter list
        </Link>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Droplets className="h-3.5 w-3.5" />
          Meter entry
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Unit {houseNo}
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          {propertyName} · {buildingName ?? "No building"} · {tenantName}
        </p>

        <p className="mt-1 text-sm text-muted-foreground">Period: {period}</p>
      </div>
    </section>
  );
}