import { APP_PLANS, type AppPlan, planSupportsTrial } from "@/lib/billing/plans";
import { Mail, MapPin, Phone } from "lucide-react";
import { CurrencySelect } from "@/components/forms/currency-select";
import {
  fieldClass,
  helperTextClass,
  iconBubbleClass,
  iconClass,
  iconFieldClass,
  panelClass,
  stepDescriptionClass,
  stepTitleClass,
} from "../_lib/constants";
import { Field } from "./new-org-ui";
import type { NewOrgFormState } from "./use-new-org-form";

type Props = Pick<
  NewOrgFormState,
  | "state"
  | "organizationName"
  | "setOrganizationName"
  | "organizationSlug"
  | "setOrganizationSlug"
  | "organizationEmail"
  | "setOrganizationEmail"
  | "organizationPhone"
  | "setOrganizationPhone"
  | "organizationAddress"
  | "setOrganizationAddress"
  | "currencyCode"
  | "setCurrencyCode"
  | "timezone"
  | "setTimezone"
  | "dataRetentionDays"
  | "setDataRetentionDays"
  | "plan"
  | "setPlan"
  | "accountType"
  | "setAccountType"
  | "generatedSlug"
>;

export function NewOrgStepOrganization(props: Props) {
  const {
    state,
    organizationName,
    setOrganizationName,
    organizationSlug,
    setOrganizationSlug,
    organizationEmail,
    setOrganizationEmail,
    organizationPhone,
    setOrganizationPhone,
    organizationAddress,
    setOrganizationAddress,
    currencyCode,
    setCurrencyCode,
    timezone,
    setTimezone,
    dataRetentionDays,
    setDataRetentionDays,
    plan,
    setPlan,
    accountType,
    setAccountType,
    generatedSlug,
  } = props;

  const selectedPlan = APP_PLANS[plan as AppPlan] ?? APP_PLANS.FREE;
  return (
    <section className={panelClass}>
      <div className="mb-6">
        <div className={iconBubbleClass}>
          <span aria-hidden="true" className="text-2xl">🏢</span>
        </div>
        <h2 className={stepTitleClass}>Organisation details</h2>
        <p className={stepDescriptionClass}>
          Add the main workspace details and default organization settings.
        </p>
      </div>

      <div className="grid gap-4">
        <Field label="Account type" required>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className={fieldClass}
          >
            <option value="PROPERTY_MANAGER">
              Property management agency
            </option>
            <option value="LANDLORD">Landlord / own portfolio</option>
          </select>
          <p className={helperTextClass}>
            Both account types receive an administrator login. Landlord accounts
            also receive a linked landlord profile.
          </p>
        </Field>

        <Field name="organizationName" label={accountType === "LANDLORD" ? "Portfolio name" : "Agency name"}
          required
          error={state.fieldErrors?.organizationName?.[0]}
        >
          <input
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder={accountType === "LANDLORD" ? "Jane’s property portfolio" : "Greenview Properties Ltd"}
            className={fieldClass}
          />
        </Field>

        <Field name="organizationSlug" label="Workspace address" error={state.fieldErrors?.organizationSlug?.[0]}>
          <input
            value={organizationSlug}
            onChange={(e) => setOrganizationSlug(e.target.value)}
            placeholder="greenview-properties"
            className={fieldClass}
          />
          <p className={helperTextClass}>
            Workspace address:{" "}
            <span className="font-medium">{generatedSlug || "—"}</span>
          </p>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="organizationEmail" label="Organisation email"
            error={state.fieldErrors?.organizationEmail?.[0]}
          >
            <div className="relative">
              <Mail className={iconClass} />
              <input
                type="email"
                value={organizationEmail}
                onChange={(e) => setOrganizationEmail(e.target.value)}
                placeholder="info@greenview.co.ke"
                className={iconFieldClass}
              />
            </div>
          </Field>

          <Field name="organizationPhone" label="Organisation phone" error={state.fieldErrors?.organizationPhone?.[0]}>
            <div className="relative">
              <Phone className={iconClass} />
              <input
                value={organizationPhone}
                onChange={(e) => setOrganizationPhone(e.target.value)}
                placeholder="+254700000000"
                className={iconFieldClass}
              />
            </div>
          </Field>
        </div>

        <Field label="Address">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <textarea
              value={organizationAddress}
              onChange={(e) => setOrganizationAddress(e.target.value)}
              placeholder="Westlands, Nairobi"
              rows={4}
              className={iconFieldClass}
            />
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Currency code">
            <CurrencySelect
              name="currencyCodeSelector"
              value={currencyCode}
              onChange={(e) =>
                setCurrencyCode(e.target.value.toUpperCase())
              }
              className={`${fieldClass} uppercase`}
            />
          </Field>

          <Field name="timezone" label="Timezone"
            required
            error={state.fieldErrors?.timezone?.[0]}
          >
            <input
              list="organisation-timezones"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Africa/Nairobi"
              className={fieldClass}
            />
          </Field>

          <Field name="dataRetentionDays" label="Data retention days"
            error={state.fieldErrors?.dataRetentionDays?.[0]}
          >
            <input
              type="number"
              min={1}
              value={dataRetentionDays}
              onChange={(e) => setDataRetentionDays(e.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>

        <datalist id="organisation-timezones">{Intl.supportedValuesOf("timeZone").map(zone => <option key={zone} value={zone} />)}</datalist>
        <Field name="plan" label="Plan" required error={state.fieldErrors?.plan?.[0]}>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className={fieldClass}
          >
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
            <option value="PLUS">Plus</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </Field>
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm" aria-live="polite">
          <p className="font-semibold">{selectedPlan.name}: {plan === "ENTERPRISE" ? "Custom pricing and limits" : `KES ${selectedPlan.monthlyAmount.toLocaleString()} / month`}</p>
          <p>{plan === "ENTERPRISE" ? "Limits agreed with sales." : `${selectedPlan.propertiesLimit} properties · ${selectedPlan.unitsLimit} units · ${selectedPlan.usersLimit} internal users`}</p>
          <p className="mt-2">{planSupportsTrial(plan) ? "14-day trial. Paid access requires billing setup after the trial." : plan === "FREE" ? "No subscription charge." : "Confirm billing terms with sales before activation."} Subscription pricing is in KES; workspace currency applies to portfolio records.</p>
        </div>
      </div>
    </section>
  );
}