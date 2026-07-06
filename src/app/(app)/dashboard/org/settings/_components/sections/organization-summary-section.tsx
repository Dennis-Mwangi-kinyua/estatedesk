import { formatLabel, type SettingsPageData } from "../../settings-data";
import { InfoRow, SectionCard } from "../../settings-ui";

export function OrganizationSummarySection({ data }: { data: SettingsPageData }) {
  return (
    <SectionCard
      id="organization-summary"
      title="Organization Summary"
      description="A quick overview of your workspace profile and status."
    >
      <div className="space-y-1 divide-y divide-slate-100">
        <InfoRow
          label="Organization Name"
          value={data.organization.name}
        />
        <InfoRow label="Slug" value={data.organization.slug} />
        <InfoRow
          label="Status"
          value={formatLabel(data.organization.status)}
        />
        <InfoRow label="Timezone" value={data.organization.timezone} />
        <InfoRow label="Currency" value={data.organization.currency} />
      </div>
    </SectionCard>
  );
}