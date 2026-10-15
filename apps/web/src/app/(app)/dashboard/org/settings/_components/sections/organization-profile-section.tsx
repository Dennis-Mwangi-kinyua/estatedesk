import Link from "@/components/navigation/workspace-link";
import { prisma } from "@/lib/prisma";
import { AGREEMENT_ENTITY } from "@/lib/service-agreements/contract";
import { OrganizationSlugEditor } from "@/components/forms/organization-slug-editor";
import { updateCurrentOrganizationSlugAction } from "@/features/organizations/actions/update-organization-slug";
import { requireUserSession } from "@/lib/auth/session";
import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";
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
  const session = await requireUserSession();
  const agreements = session.activeOrgRole === "ADMIN" ? await prisma.documentRecord.findMany({ where: { orgId: data.organization.id, entityType: AGREEMENT_ENTITY, status: "COMPLETED" }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true } }) : [];
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
      {agreements.length > 0 ? <div className="mb-5 space-y-3"><h3 className="font-semibold">Signed service agreements</h3>{agreements.map(agreement => <div key={agreement.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><Link href={`/dashboard/org/agreements/${agreement.id}`} className="text-sm font-medium">{agreement.title}</Link><a href={`/api/service-agreements/${agreement.id}`} className="text-sm font-semibold text-primary">Download signed PDF</a></div>)}</div> : null}
      <div className="mb-5"><OrganizationNameEditor name={data.organization.name} action={renameCurrentOrganizationAction} /></div>
      {memberHasOrgPermission(session, "org.settings.manage") && <div className="mb-5"><OrganizationSlugEditor slug={data.organization.slug} action={updateCurrentOrganizationSlugAction} /></div>}
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