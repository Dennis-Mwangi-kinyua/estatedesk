"use client";

import { CheckCircle2 } from "lucide-react";
import type { ReviewSummary } from "../_lib/types";
import {
  infoPanelClassName,
  stepDescriptionClassName,
  stepTitleClassName,
} from "../_lib/wizard-ui";

export function StepReview({
  reviewSummary,
  reviewConfirmed,
}: {
  reviewSummary: ReviewSummary | null;
  reviewConfirmed: boolean;
}) {
  if (!reviewSummary) {
    return (
      <section className="block">
        <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-5 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">
            Review summary is loading
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Go back one step and continue again if this message persists.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="block">
      <div className="space-y-5">
        <div>
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h2 className={`${stepTitleClassName} mt-4`}>Review before create</h2>
          <p className={stepDescriptionClassName}>
            Check the property profile, billing defaults, landlord link, and unit
            generation plan below. Nothing is saved until you confirm and choose
            Create property.
          </p>
        </div>

        {reviewConfirmed ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            Details reviewed. Use Create property below when you are ready to
            save this property and generate its initial units.
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Read through every section, then choose I have reviewed these details
            to unlock property creation.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={infoPanelClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Property profile
            </p>

            <dl className="mt-4 space-y-3 text-sm">
              <ReviewRow label="Name" value={reviewSummary.name} />
              <ReviewRow label="Type" value={reviewSummary.type} />
              <ReviewRow
                label="Taxpayer profile"
                value={reviewSummary.taxpayerProfile}
              />
              <ReviewRow label="Landlord" value={reviewSummary.landlord} />
              <ReviewRow label="Location" value={reviewSummary.location} />
              <ReviewRow label="Address" value={reviewSummary.address} />
            </dl>
          </div>

          <div className={infoPanelClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Billing & status
            </p>

            <dl className="mt-4 space-y-3 text-sm">
              <ReviewRow label="Water rate" value={reviewSummary.waterRatePerUnit} />
              <ReviewRow
                label="Fixed charge"
                value={reviewSummary.waterFixedCharge}
              />
              <ReviewRow
                label="Status"
                value={reviewSummary.isActive ? "Active" : "Inactive"}
              />
              <div className="pt-2">
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="mt-2 rounded-xl border border-border bg-background p-3 text-foreground">
                  {reviewSummary.notes}
                </dd>
              </div>
            </dl>
          </div>

          <div className={`${infoPanelClassName} lg:col-span-2`}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Unit generation summary
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Stat label="Unit mix rows" value={reviewSummary.unitMixCount} />
              <Stat
                label="Generated units"
                value={reviewSummary.totalGeneratedUnits}
              />
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Destination
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  Units will appear on the units page immediately
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold text-foreground">
                Unit mix preview
              </p>

              {reviewSummary.unitMixLabels.length ? (
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {reviewSummary.unitMixLabels.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No unit mix rows added. The property will be created without
                  initial units.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] text-right font-medium text-foreground">
        {value ?? "—"}
      </dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}