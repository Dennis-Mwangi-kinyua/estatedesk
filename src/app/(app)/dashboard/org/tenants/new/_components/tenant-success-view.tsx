"use client";

import Link from "next/link";
import { buttonPrimaryClassName, buttonSecondaryClassName } from "../_lib/constants";
import type { ActionState } from "../_lib/types";
import { InfoCard, panelShellClassName } from "./ui-primitives";

export function TenantSuccessView({ state }: { state: ActionState }) {
  if (state.status !== "success" || !state.credentials) {
    return null;
  }

  return (
    <div className="org-theme-content mx-auto w-full max-w-3xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className={`${panelShellClassName} overflow-hidden border-emerald-200 dark:border-emerald-800`}>
        <div className="border-b border-emerald-200 bg-emerald-50/70 px-5 py-6 dark:border-emerald-800 dark:bg-emerald-950/30 sm:px-7">
          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-background px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:text-emerald-200">
            Tenant created successfully
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Tenant account is ready
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            The tenant profile, next of kin details, and login account have been
            created successfully.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-7">
          <InfoCard title="Tenant">
            <p className="text-base font-semibold text-foreground">
              {state.credentials.tenantName}
            </p>
          </InfoCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard title="Username">
              <p className="break-all font-mono text-base font-semibold text-foreground">
                {state.credentials.username}
              </p>
            </InfoCard>

            <InfoCard title="Temporary password">
              <p className="break-all font-mono text-base font-semibold text-foreground">
                {state.credentials.password}
              </p>
            </InfoCard>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Save these credentials now. The password is only shown once on this screen.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/org/tenants" className={buttonPrimaryClassName}>
              Go to tenants
            </Link>

            <Link href="/dashboard/org/tenants/new" className={buttonSecondaryClassName}>
              Create another tenant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}