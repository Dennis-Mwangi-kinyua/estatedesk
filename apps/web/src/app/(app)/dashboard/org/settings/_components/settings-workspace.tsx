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
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <SettingsHeader orgRole={orgRole} />
      <SettingsStats
        data={data}
        activeMembers={activeMembers}
        activeApiKeys={activeApiKeys}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SettingsDirectorySection />
        <SettingsGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}