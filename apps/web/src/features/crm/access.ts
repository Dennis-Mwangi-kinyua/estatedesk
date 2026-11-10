import "server-only";
import { redirect } from "next/navigation";
import { requireOrgRole } from "@/lib/permissions/guards";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
export async function requireOrgCrmAccess() {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
  if (!canAccessWorkspacePath(session, "/dashboard/org/crm")) redirect("/access-denied");
  return session;
}
