"use client";

import { stepPanelClassName } from "../_lib/constants";
import { formatStatus } from "../_lib/helpers";
import type { PreviewData } from "../_lib/types";
import { InfoCard, SectionTitle } from "./ui-primitives";

export function StepPreview({ preview }: { preview: PreviewData | null }) {
  return (
    <div className={stepPanelClassName}>
      <SectionTitle
        title="Preview before save"
        description="Review the tenant profile and account details before you create it."
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
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
              <span className="font-medium text-foreground">Rent override:</span>{" "}
              {preview?.monthlyRent || "Use selected unit rent"}
            </p>
            <p>
              <span className="font-medium text-foreground">Deposit override:</span>{" "}
              {preview?.deposit || "Use selected unit deposit"}
            </p>
          </div>
        </InfoCard>

        <InfoCard title="Account details preview">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                Suggested username:
              </span>{" "}
              {preview?.usernamePreview || "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">Password:</span>{" "}
              Temporary password will be generated on save
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              If the suggested username is already taken, the saved username may
              be adjusted automatically.
            </p>
          </div>
        </InfoCard>
      </div>
    </div>
  );
}