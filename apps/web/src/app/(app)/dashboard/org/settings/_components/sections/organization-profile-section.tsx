import { OrganizationSlugEditor } from "@/components/forms/organization-slug-editor";
import { updateCurrentOrganizationSlugAction } from "@/features/organizations/actions/update-organization-slug";
import { requireOrgAccess } from "@/lib/auth/org";
import { roleHasOrgPermission } from "@/lib/permissions/role-matrix";
import { OrganizationNameEditor } from "@/components/forms/organization-name-editor";
import { renameCurrentOrganizationAction } from "@/features/organizations/actions/rename-organization";
import { CurrencySelect } from "@/components/forms/currency-select";
import { updateOrganizationAction } from "@/features/settings/actions/settings-actions";
import {
  buttonPrimaryClassName,
  fieldClassName,
  labelClassName,
} from "../../_lib/helpers";
import { formatLabel, type SettingsPageData } from "../../settings-data";
import {
  InputField,
  SectionCard,
  StatusBadge,
} from "../../settings-ui";

export async function OrganizationProfileSection({ data }: { data: SettingsPageData }) {
  const membership = await requireOrgAccess(data.organization.id);
  return (
    <SectionCard
      id="organization-profile"
      title="Organization Profile"
      description="Update your company profile, contact information, and regional defaults."
      action={
        <StatusBadge
          label={formatLabel(data.organization.status)}
          variant={
            data.organization.status === "ACTIVE"
              ? "success"
              : data.organization.status === "SUSPENDED"
                ? "warning"
                : "danger"
          }
        />
      }
    >
      <div className="mb-5"><OrganizationNameEditor name={data.organization.name} action={renameCurrentOrganizationAction} /></div>
      {roleHasOrgPermission(membership.role, "org.settings.manage") && <div className="mb-5"><OrganizationSlugEditor slug={data.organization.slug} action={updateCurrentOrganizationSlugAction} /></div>}
      <form
        action={updateOrganizationAction}
        className="grid gap-4 md:grid-cols-2"
      >
        <input type="hidden" name="organizationName" value={data.organization.name} />
        <InputField
          label="Email Address"
          name="email"
          type="email"
          defaultValue={data.organization.email}
          placeholder="company@example.com"
        />
        <InputField
          label="Phone Number"
          name="phone"
          defaultValue={data.organization.phone}
          placeholder="+254 700 000 000"
        />
        <div className="md:col-span-2">
          <InputField
            label="Address"
            name="address"
            defaultValue={data.organization.address}
            placeholder="Westlands, Nairobi, Kenya"
          />
        </div>
        <InputField
          label="Timezone"
          name="timezone"
          defaultValue={data.organization.timezone}
        />
        <label className={labelClassName}>
          Currency
          <CurrencySelect
            name="currency"
            defaultValue={data.organization.currency}
            className={fieldClassName}
          />
        </label>

        <div className="flex justify-end md:col-span-2">
          <button data-workspace-action="true" type="submit" className={buttonPrimaryClassName}>
            Update Organization
          </button>
        </div>
      </form>
    </SectionCard>
  );
}