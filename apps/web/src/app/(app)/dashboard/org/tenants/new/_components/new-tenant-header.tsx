import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { stepItems } from "../_lib/constants";
import { panelShellClassName } from "./ui-primitives";

export function NewTenantHeader({
  orgName,
  availableUnitsCount,
}: {
  orgName: string;
  availableUnitsCount: number;
}) {
  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <UserPlus className="h-3.5 w-3.5" />
              Tenant setup
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Create new tenant
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Create a tenant for{" "}
              <span className="font-medium text-foreground">{orgName}</span> through one
              guided flow: identity, next of kin, unit and lease, then final review.
            </p>
          </div>

          <Link
            href="/dashboard/org/tenants"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tenants
          </Link>
        </div>
      </div>

      <div className="grid gap-3 border-b border-border px-5 py-5 sm:grid-cols-3 sm:px-6">
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Guided steps
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">4</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Vacant units
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {availableUnitsCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Account created
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">On save</p>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        {stepItems.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border bg-muted/15 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {item.id}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}