import { requireManagementAccess } from "@/lib/permissions/guards";
import { requireUserSession } from "@/lib/auth/session";
import { getSettingsPageData } from "./settings-data";
import { SettingsHome } from "./_components/settings-home";
import { SettingsSectionView } from "./_components/settings-section-page";
import type { SettingsSectionId } from "./settings-ui-nav";

export { SETTINGS_NAV_ITEMS } from "./settings-ui-nav";
export type { SettingsSectionId } from "./settings-ui-nav";

export async function SettingsHomePage() {
  return <SettingsHome />;
}

export async function SettingsSectionPage({
  sectionId,
}: {
  sectionId: SettingsSectionId;
}) {
  const session = await requireManagementAccess();
  const userSession = await requireUserSession();

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const data = await getSettingsPageData(session.activeOrgId);

  const activeMembers = data.members.filter(
    (member) => member.status === "ACTIVE",
  ).length;

  const activeApiKeys = data.apiKeys.filter(
    (key) => key.status === "ACTIVE",
  ).length;

  return (
    <SettingsSectionView
      sectionId={sectionId}
      data={data}
      session={userSession}
      activeMembers={activeMembers}
      activeApiKeys={activeApiKeys}
      orgRole={session.activeOrgRole}
    />
  );
}