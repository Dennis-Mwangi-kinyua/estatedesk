import { Building2, Mail, MapPin, Phone } from "lucide-react";
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

  return (
    <section className={panelClass}>
      <div className="mb-6">
        <div className={iconBubbleClass}>
          <Building2 className="h-5 w-5" />
        </div>
        <h2 className={stepTitleClass}>Organization details</h2>
        <p className={stepDescriptionClass}>
          Add the main workspace details and default organization settings.
        </p>
      </div>

      <div className="grid gap-4">
        <Field
          label="Organization name"
          required
          error={state.fieldErrors?.organizationName?.[0]}
        >
          <input
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="Greenview Properties Ltd"
            className={fieldClass}
          />
        </Field>

        <Field label="Slug">
          <input
            value={organizationSlug}
            onChange={(e) => setOrganizationSlug(e.target.value)}
            placeholder="greenview-properties"
            className={fieldClass}
          />
          <p className={helperTextClass}>
            Generated slug:{" "}
            <span className="font-medium">{generatedSlug || "—"}</span>
          </p>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Organization email"
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

          <Field label="Organization phone">
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

          <Field
            label="Timezone"
            required
            error={state.fieldErrors?.timezone?.[0]}
          >
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Africa/Nairobi"
              className={fieldClass}
            />
          </Field>

          <Field
            label="Data retention days"
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

        <Field label="Plan" required error={state.fieldErrors?.plan?.[0]}>
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

        <Field label="Account type" required>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className={fieldClass}
          >
            <option value="PROPERTY_MANAGER">
              Property management organization
            </option>
            <option value="LANDLORD">Landlord organization</option>
          </select>
          <p className={helperTextClass}>
            The master login is always an organization admin. Landlord
            access can be mapped separately after setup.
          </p>
        </Field>
      </div>
    </section>
  );
}