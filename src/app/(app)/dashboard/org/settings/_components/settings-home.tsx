import { requireManagementAccess } from "@/lib/permissions/guards";
import { getSettingsPageData } from "../settings-data";
import { SettingsWorkspace } from "./settings-workspace";

export async function SettingsHome() {
  const session = await requireManagementAccess();

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
    <SettingsWorkspace
      data={data}
      activeMembers={activeMembers}
      activeApiKeys={activeApiKeys}
      orgRole={session.activeOrgRole}
    />
  );
}