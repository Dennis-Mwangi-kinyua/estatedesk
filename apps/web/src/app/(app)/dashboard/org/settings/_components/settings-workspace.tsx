import type { OrgRole } from "@prisma/client";
import type { SettingsPageData } from "../settings-data";
import { SettingsDirectorySection } from "./settings-directory-section";
import { SettingsGuidance } from "./settings-guidance";
import { SettingsHeader } from "./settings-header";
import { SettingsStats } from "./settings-stats";

export function SettingsWorkspace({
  data,
  activeMembers,
  activeApiKeys,
  orgRole,
}: {
  data: SettingsPageData;
  activeMembers: number;
  activeApiKeys: number;
  orgRole?: OrgRole | null;
}) {
  return (
    <div className="org-theme-content settings-page mx-auto w-full min-w-0 max-w-7xl space-y-5 px-0 pb-24 pt-2 sm:px-2">
      <SettingsHeader orgRole={orgRole} />
      <SettingsStats
        data={data}
        activeMembers={activeMembers}
        activeApiKeys={activeApiKeys}
      />

      <div className="grid min-w-0 gap-5">
        <SettingsDirectorySection />
        <SettingsGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}