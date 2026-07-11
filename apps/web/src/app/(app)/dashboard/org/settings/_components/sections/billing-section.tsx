import {
  requestPlanUpgradeAction,
  updateBillingAction,
} from "@/features/settings/actions/settings-actions";
import { APP_PLANS, APP_PLAN_ORDER } from "@/lib/billing/plans";
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
  const currentPlan = data.subscription.plan as keyof typeof APP_PLANS;
  const planMeta = APP_PLANS[currentPlan] ?? APP_PLANS.FREE;
  const upgradeTargets = APP_PLAN_ORDER.filter(
    (plan) => plan !== "FREE" && plan !== currentPlan,
  );

  const pendingRequest =
    data.subscription.upgradeRequest &&
    data.subscription.upgradeRequest.status === "PENDING"
      ? data.subscription.upgradeRequest
      : null;

  return (
    <SectionCard
      id="billing"
      title="Billing & Subscription"
      description="View your plan limits, update billing contact, and request upgrades. Plan changes are applied by platform operators after payment confirmation."
    >
      <div className="rounded-2xl border border-border bg-muted/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {formatLabel(data.subscription.plan)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {planMeta.propertiesLimit === Number.MAX_SAFE_INTEGER
                ? "Unlimited properties"
                : `${planMeta.propertiesLimit} properties`}
              {" · "}
              {planMeta.unitsLimit === Number.MAX_SAFE_INTEGER
                ? "Unlimited units"
                : `${planMeta.unitsLimit} units`}
              {" · "}
              {planMeta.usersLimit === Number.MAX_SAFE_INTEGER
                ? "Unlimited staff"
                : `${planMeta.usersLimit} staff users`}
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
          <InfoRow
            label="Monthly fee"
            value={
              planMeta.monthlyAmount > 0
                ? `KES ${planMeta.monthlyAmount.toLocaleString("en-KE")}`
                : currentPlan === "ENTERPRISE"
                  ? "Custom"
                  : "KES 0"
            }
          />
        </div>
      </div>

      {pendingRequest ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
          <p className="font-semibold">Upgrade request pending</p>
          <p className="mt-1">
            You requested <strong>{formatLabel(pendingRequest.plan)}</strong>
            {pendingRequest.requestedAt
              ? ` on ${new Date(pendingRequest.requestedAt).toLocaleDateString("en-KE")}`
              : ""}
            . Platform admins will confirm payment and apply the plan.
          </p>
          {pendingRequest.notes ? (
            <p className="mt-2 text-xs opacity-90">Notes: {pendingRequest.notes}</p>
          ) : null}
        </div>
      ) : null}

      <form action={updateBillingAction} className="mt-4 space-y-4">
        <InputField
          label="Billing Email"
          name="billingEmail"
          type="email"
          defaultValue={data.subscription.billingEmail}
        />

        <button type="submit" className={`w-full ${buttonPrimaryClassName}`}>
          Update billing contact
        </button>
      </form>

      {upgradeTargets.length > 0 ? (
        <form
          action={requestPlanUpgradeAction}
          className="mt-6 space-y-4 border-t border-border pt-6"
        >
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Request plan upgrade
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Organizations cannot self-assign paid plans. Submit a request; after
              payment is confirmed, a platform operator activates the plan.
            </p>
          </div>

          <SelectField
            label="Requested plan"
            name="requestedPlan"
            defaultValue={upgradeTargets[0] ?? "PRO"}
            options={upgradeTargets}
          />

          <div className="space-y-2">
            <label
              htmlFor="upgradeNotes"
              className="text-sm font-medium text-foreground"
            >
              Notes for support (optional)
            </label>
            <textarea
              id="upgradeNotes"
              name="upgradeNotes"
              rows={3}
              placeholder="Payment reference, preferred start date, portfolio size…"
              className="min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
            />
          </div>

          <button type="submit" className={`w-full ${buttonPrimaryClassName}`}>
            Submit upgrade request
          </button>
        </form>
      ) : null}
    </SectionCard>
  );
}
