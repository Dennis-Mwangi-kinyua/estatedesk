import { Globe2, MapPin } from "lucide-react";
import { Mail, Phone } from "@/components/shared/colored-icons";
import type { SettingsPageData } from "../../settings-data";
import { SectionCard, SmallInfoCard } from "../../settings-ui";

export function ContactRegionSection({ data }: { data: SettingsPageData }) {
  return (
    <SectionCard
      id="contact-region"
      title="Contact & Region"
      description="Primary business contact details for this organization."
    >
      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
        <SmallInfoCard
          icon={Mail}
          title="Email"
          value={data.organization.email || "Not set"}
        />
        <SmallInfoCard
          icon={Phone}
          title="Phone"
          value={data.organization.phone || "Not set"}
        />
        <SmallInfoCard
          icon={MapPin}
          title="Address"
          value={data.organization.address || "Not set"}
        />
        <SmallInfoCard
          icon={Globe2}
          title="Timezone"
          value={data.organization.timezone}
        />
      </div>
    </SectionCard>
  );
}