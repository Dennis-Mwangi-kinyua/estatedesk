import { updateBillingAction } from "@/features/settings/actions/settings-actions";
import { buttonPrimaryClassName } from "../../_lib/helpers";
import { formatLabel, type SettingsPageData } from "../../settings-data";
import {
  InfoRow,
  InputField,
  SectionCard,
  SelectField,
  StatusBadge,
} from "../../settings-ui";

export function BillingSection({ data }: { data: SettingsPageData }) {
  return (
    <SectionCard
      id="billing"
      title="Billing & Subscription"
      description="Current plan details and billing contact information."
    >
      <div className="rounded-2xl border border-border bg-muted/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {formatLabel(data.subscription.plan)}
            </p>
          </div>

          <StatusBadge
            label={formatLabel(data.subscription.status)}
            variant={
              data.subscription.status === "ACTIVE"
                ? "success"
                : data.subscription.status === "PAST_DUE"
                  ? "warning"
                  : "muted"
            }
          />
        </div>

        <div className="mt-4 space-y-1">
          <InfoRow
            label="Billing Email"
            value={data.subscription.billingEmail || "—"}
          />
          <InfoRow
            label="Renewal Date"
            value={data.subscription.renewalDate}
          />
        </div>
      </div>

      <form action={updateBillingAction} className="mt-4 space-y-4">
        <InputField
          label="Billing Email"
          name="billingEmail"
          type="email"
          defaultValue={data.subscription.billingEmail}
        />
        <SelectField
          label="Subscription Plan"
          name="subscriptionPlan"
          defaultValue={data.subscription.plan}
          options={["FREE", "PRO", "PLUS", "ENTERPRISE"]}
        />

        <button type="submit" className={`w-full ${buttonPrimaryClassName}`}>
          Update Billing
        </button>
      </form>
    </SectionCard>
  );
}