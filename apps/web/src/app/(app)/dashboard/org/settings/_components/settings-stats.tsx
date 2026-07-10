import { Building2, CreditCard, KeyRound, Users } from "lucide-react";
import { formatLabel, type SettingsPageData } from "../settings-data";
import { StatCard } from "./settings-ui";

export function SettingsStats({
  data,
  activeMembers,
  activeApiKeys,
}: {
  data: SettingsPageData;
  activeMembers: number;
  activeApiKeys: number;
}) {
  const orgStatusHighlight =
    data.organization.status === "ACTIVE" ? "success" : "warning";

  return (
    <section className="grid grid-cols-[repeat(auto-fit,minmax(11.75rem,1fr))] gap-3">
      <StatCard
        label="Organization"
        value={data.organization.name}
        note={formatLabel(data.organization.status)}
        icon={Building2}
        highlight={orgStatusHighlight}
      />
      <StatCard
        label="Plan"
        value={formatLabel(data.subscription.plan)}
        note={`Status: ${formatLabel(data.subscription.status)}`}
        icon={CreditCard}
      />
      <StatCard
        label="Active Team Members"
        value={activeMembers}
        note={`Total members: ${data.members.length}`}
        icon={Users}
        highlight={activeMembers > 0 ? "success" : "default"}
      />
      <StatCard
        label="Active API Keys"
        value={activeApiKeys}
        note="External integrations and app access"
        icon={KeyRound}
      />
    </section>
  );
}