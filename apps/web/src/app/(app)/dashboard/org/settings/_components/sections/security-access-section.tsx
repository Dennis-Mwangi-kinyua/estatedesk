import { BadgeCheck, CalendarDays, ShieldCheck } from "lucide-react";
import type { SettingsPageData } from "../../settings-data";
import { SectionCard, SmallInfoCard } from "../../settings-ui";

export function SecurityAccessSection({
  data,
  activeMembers,
  activeApiKeys,
}: {
  data: SettingsPageData;
  activeMembers: number;
  activeApiKeys: number;
}) {
  return (
    <SectionCard
      id="security-access"
      title="Security & Access"
      description="A quick administrative view of workspace access."
    >
      <div className="grid gap-3">
        <SmallInfoCard
          icon={ShieldCheck}
          title="Member Access"
          value={
            <>
              {activeMembers} active member
              {activeMembers === 1 ? "" : "s"} currently have access to
              this organization.
            </>
          }
        />
        <SmallInfoCard
          icon={BadgeCheck}
          title="API Credentials"
          value={
            <>
              {activeApiKeys} active API key
              {activeApiKeys === 1 ? "" : "s"} available for
              integrations and external services.
            </>
          }
        />
        <SmallInfoCard
          icon={CalendarDays}
          title="Subscription Renewal"
          value={
            <>
              Next renewal is scheduled for{" "}
              <span className="font-medium text-slate-900">
                {data.subscription.renewalDate}
              </span>
              .
            </>
          }
        />
      </div>
    </SectionCard>
  );
}