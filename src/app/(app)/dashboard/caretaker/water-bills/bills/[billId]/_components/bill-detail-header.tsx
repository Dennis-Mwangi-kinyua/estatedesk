import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { StatusBadge } from "@/app/(app)/dashboard/caretaker/water-bills/_components/water-bills-ui";
import { billStatusTone } from "../_lib/helpers";
import type { CaretakerBillDetailPageData } from "../_lib/types";

export function BillDetailHeader({
  data,
}: {
  data: Extract<CaretakerBillDetailPageData, { ok: true }>;
}) {
  const { bill } = data;

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
            <p className="text-sm text-muted-foreground">Tenant bill</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              House {bill.unit.houseNo}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {bill.unit.property.name} ·{" "}
              {bill.unit.building?.name ?? "No building"} · {bill.tenant.fullName}
            </p>
          </div>

          <StatusBadge
            label={bill.status.replaceAll("_", " ")}
            tone={billStatusTone(bill.status)}
          />
        </div>
      </div>
    </section>
  );
}