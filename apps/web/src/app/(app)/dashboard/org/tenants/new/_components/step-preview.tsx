"use client";

import { stepPanelClassName } from "../_lib/constants";
import { formatCurrency, formatStatus } from "../_lib/helpers";
import type { PreviewData } from "../_lib/types";
import { InfoCard, SectionTitle } from "./ui-primitives";

export function StepPreview({ preview, currencyCode }: { preview: PreviewData | null; currencyCode: string }) {
  return (
    <div className={stepPanelClassName}>
      <SectionTitle
        title="Review before save"
        description="Confirm the tenant profile, login account, and assignment details before creating the record."
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {!preview?.existingLease && preview && Number.isFinite(Number(preview.monthlyRent)) && Number.isFinite(Number(preview.deposit)) ? (
          <InfoCard title="First rent and deposit bill">
            <div className="space-y-2 text-sm">
              <p>First month rent: {formatCurrency(Number(preview.monthlyRent), currencyCode)}</p>
              <p>Security deposit: {formatCurrency(Number(preview.deposit), currencyCode)}</p>
              <p className="font-semibold">Total first bill: {formatCurrency(Number(preview.monthlyRent) + Number(preview.deposit), currencyCode)}</p>
              <p className="text-muted-foreground">Payment is recorded separately when money is received.</p>
            </div>
          </InfoCard>
        ) : null}
        {preview?.existingLease ? <InfoCard title="Existing lease and previous arrears"><div className="space-y-2 text-sm"><p>Initial rent and deposit charges will not be recreated.</p>{preview.openingArrears?.map(entry => <p key={entry.period}>{entry.period}: {entry.amount}</p>)}<p className="font-semibold">Total previous arrears: {(preview.openingArrears ?? []).reduce((sum, entry) => sum + Math.round(Number(entry.amount) * 100), 0) / 100}</p></div></InfoCard> : null}
        <InfoCard title="Tenant profile">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Name:</span>{" "}
              {preview?.fullName || "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">Phone:</span>{" "}
              {preview?.phone || "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">Email:</span>{" "}
              {preview?.email || "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">National ID:</span>{" "}
              {preview?.nationalId || "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">KRA PIN:</span>{" "}
              {preview?.kraPin || "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">Status:</span>{" "}
              {preview?.status ? formatStatus(preview.status) : "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">Notes:</span>{" "}
              {preview?.notes || "—"}
            </p>
          </div>
        </InfoCard>

        <InfoCard title="Login account">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Username:</span>{" "}
              <span className="font-mono text-foreground">
                {preview?.username || "—"}
              </span>
            </p>
            <p>
              <span className="font-medium text-foreground">Password:</span>{" "}
              <span className="font-mono text-foreground">
                {preview?.password || "—"}
              </span>
            </p>
            <p className="text-xs leading-5">
              The tenant must change this password on first sign-in.
            </p>
          </div>
        </InfoCard>

        <InfoCard title="Next of kin">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Name:</span>{" "}
              {preview?.nextOfKinName || "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">Relationship:</span>{" "}
              {preview?.nextOfKinRelationship || "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">Phone:</span>{" "}
              {preview?.nextOfKinPhone || "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">Email:</span>{" "}
              {preview?.nextOfKinEmail || "—"}
            </p>
          </div>
        </InfoCard>

        <InfoCard title="Unit mapping">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Selected unit:</span>{" "}
              {preview?.selectedUnitLabel || "No unit assignment yet"}
            </p>
            <p>
              <span className="font-medium text-foreground">Lease start:</span>{" "}
              {preview?.leaseStartDate || "Use today’s date"}
            </p>
            <p>
              <span className="font-medium text-foreground">Due day:</span>{" "}
              {preview?.dueDay || "5"}
            </p>
            <p>
              <span className="font-medium text-foreground">Agreed monthly rent:</span>{" "}
              {preview?.monthlyRent || "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">Agreed deposit:</span>{" "}
              {preview?.deposit || "—"}
            </p>
          </div>
        </InfoCard>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        Saving will create the tenant profile, next of kin record, login account,
        and unit assignment (if selected).
      </div>
    </div>
  );
}
