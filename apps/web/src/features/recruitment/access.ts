import "server-only";
import { redirect } from "next/navigation";
import { requireOrgRole, requirePlatformRole } from "@/lib/permissions/guards";
import { hiringOrgId, type HiringScope } from "./scope";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
export { hiringBase, hiringOrgId, type HiringScope } from "./scope";
export async function requireHiringAccess(scope: HiringScope) {
  const session = scope === "platform" ? await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]) : await requireOrgRole(["ADMIN", "MANAGER"]);
  try { hiringOrgId(session, scope); } catch { redirect("/access-denied"); }
  if (scope === "organization") await requireActiveSubscription(session.activeOrgId!);
  return session;
}
