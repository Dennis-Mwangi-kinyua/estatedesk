import { CheckCircle2 } from "lucide-react";
import { panelClass, stepDescriptionClass, stepTitleClass } from "../_lib/constants";
import { ReviewCard } from "./new-org-ui";
import type { NewOrgFormState } from "./use-new-org-form";

type Props = Pick<
  NewOrgFormState,
  | "organizationName"
  | "generatedSlug"
  | "organizationEmail"
  | "organizationPhone"
  | "organizationAddress"
  | "currencyCode"
  | "timezone"
  | "plan"
  | "accountType"
  | "dataRetentionDays"
  | "adminFullName"
  | "adminUsername"
  | "adminEmail"
  | "adminPhone"
>;

export function NewOrgStepReview(
  props: Props & {
    reviewConfirmed: boolean;
  },
) {
  const {
    organizationName,
    generatedSlug,
    organizationEmail,
    organizationPhone,
    organizationAddress,
    currencyCode,
    timezone,
    plan,
    accountType,
    dataRetentionDays,
    adminFullName,
    adminUsername,
    adminEmail,
    adminPhone,
    reviewConfirmed,
  } = props;

  return (
    <section className={panelClass}>
      <div className="mb-6">
        <div className="inline-flex rounded-full bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h2 className={stepTitleClass}>Review details</h2>
        <p className={stepDescriptionClass}>
          Check the organization and master login details below. Nothing is
          saved until you confirm and choose Create organization.
        </p>
      </div>

      {reviewConfirmed ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
          Details reviewed. Use Create organization below when you are ready to
          save this workspace.
        </div>
      ) : null}

      <div className="grid gap-4">
        <ReviewCard
          title="Organization"
          items={[
            ["Name", organizationName || "—"],
            ["Slug", generatedSlug || "—"],
            ["Email", organizationEmail || "—"],
            ["Phone", organizationPhone || "—"],
            ["Address", organizationAddress || "—"],
            ["Currency", currencyCode || "—"],
            ["Timezone", timezone || "—"],
            ["Plan", plan || "—"],
            [
              "Account type",
              accountType === "LANDLORD"
                ? "Landlord organization"
                : "Property management organization",
            ],
            ["Retention", `${dataRetentionDays || "—"} days`],
          ]}
        />

        <ReviewCard
          title="Master login"
          items={[
            ["Full name", adminFullName || "—"],
            ["Username", adminUsername || "—"],
            ["Login email", adminEmail || "—"],
            ["Phone", adminPhone || "—"],
            ["Org role", "ADMIN"],
            ["Platform role", "USER"],
          ]}
        />
      </div>
    </section>
  );
}