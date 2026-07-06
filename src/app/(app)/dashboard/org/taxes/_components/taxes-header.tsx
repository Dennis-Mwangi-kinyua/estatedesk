import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft, Landmark, Receipt } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { TAXES_WORKFLOW_STEPS } from "../_lib/constants";
import { panelShellClassName } from "./taxes-ui";

export function TaxesHeader({ orgRole }: { orgRole?: OrgRole | null }) {
  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Receipt className="h-3.5 w-3.5" />
              Tax compliance
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              KRA rental income tax
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Manage taxpayer profiles, KRA connection status, MRI returns, linked
              tax charges, and remittance activity from one compliance desk.
            </p>

            <InAppGuideHint topic="rent" workspace="org" orgRole={orgRole} />
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
              href="/dashboard/org/payments"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <Landmark className="h-4 w-4" />
              View payments
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
        {TAXES_WORKFLOW_STEPS.map((item) => (
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