import { Building2, WalletCards as CreditCard, KeyRound, UsersRound as Users } from "@/components/shared/colored-icons";
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
    <section className="workspace-card-grid grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
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