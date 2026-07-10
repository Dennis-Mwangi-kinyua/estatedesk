import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContactActions } from "@/app/(app)/dashboard/caretaker/_components/contact-actions";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { statusClasses } from "../_lib/helpers";
import type { CaretakerTenantDetailPageData } from "../_lib/types";

export function TenantDetailHeader({
  data,
}: {
  data: Extract<CaretakerTenantDetailPageData, { ok: true }>;
}) {
  const { tenant, activeLease } = data;

  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <Link
          href="/dashboard/caretaker/tenants"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tenants
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm text-muted-foreground">Tenant profile</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {tenant.fullName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {activeLease
                ? [
                    activeLease.unit.property.name,
                    activeLease.unit.building?.name,
                    `House ${activeLease.unit.houseNo}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "No lease in your assigned units"}
            </p>
          </div>

          <span
            className={`inline-flex h-fit rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusClasses(
              tenant.status,
            )}`}
          >
            {tenant.status.toLowerCase()}
          </span>
        </div>

        <div className="mt-5">
          <ContactActions phone={tenant.phone} email={tenant.email} />
        </div>
      </div>
    </section>
  );
}