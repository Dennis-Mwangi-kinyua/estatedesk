import "server-only";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { redirect } from "next/navigation";
import { assertManagementSession, type ManagementSection } from "./policy";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
export async function requireOrgManagement(section: ManagementSection) {
  const session = await requireManagementAccess();
  try { assertManagementSession(session, section); } catch { redirect("/access-denied"); }
  await requireActiveSubscription(session.activeOrgId!);
  return session;
}
