"use client";

import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft, Building2 } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { STEPS } from "../_lib/constants";
import { buttonSecondaryClassName } from "../_lib/wizard-ui";

export function WizardHeader({
  orgName,
  helpOrgRole,
}: {
  orgName: string;
  helpOrgRole: OrgRole;
}) {
  return (
    <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            Property setup
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Create new property
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Add a property under{" "}
            <span className="font-medium text-foreground">{orgName}</span>. This
            guided flow captures the property profile, billing defaults, and
            initial unit mix in a structured way.
          </p>

          <InAppGuideHint topic="portfolio" workspace="org" orgRole={helpOrgRole} />
        </div>

        <Link
          href="/dashboard/org/properties"
          className={`gap-2 ${buttonSecondaryClassName}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Guided steps
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {STEPS.length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Unit mix
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">Auto-create</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Review
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">Before save</p>
        </div>
      </div>
    </div>
  );
}