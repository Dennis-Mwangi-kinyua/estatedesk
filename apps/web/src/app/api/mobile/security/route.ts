import { getManagedUserSessions } from "@/lib/auth/session";
import { nativeRoute, nativeBody, actionResult } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { nativeTenantSection } from "@/lib/mobile/tenant-section";
import { mobileSecurityInputSchema } from "@estatedesk/contracts/mobile";
import { revokeSessionAction, revokeOtherSessionsAction } from "@/app/(app)/dashboard/security/actions";
import { updateTenantPasswordAction } from "@/app/(app)/dashboard/tenant/profile/actions";
import { rolePolicyBlocksPath } from "@/lib/permissions/org-role-policy";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    if (rolePolicyBlocksPath(session.orgRolePolicy, "/dashboard/security")) return mobileJson({ error: "Security access is unavailable." }, 403);
    return mobileJson(await getManagedUserSessions(session.userId));
  });
}
export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    if (rolePolicyBlocksPath(session.orgRolePolicy, "/dashboard/security")) return mobileJson({ error: "Security access is unavailable." }, 403);
    const input = await nativeBody(request, mobileSecurityInputSchema);
    if (input.action === "password") {
      if (session.activeOrgRole !== "TENANT" || !await nativeTenantSection(session, "/dashboard/tenant/profile/change-password")) return mobileJson({ error: "Password changes are unavailable for this workspace." }, 403);
      const form = new FormData();
      form.set("currentPassword", input.currentPassword); form.set("newPassword", input.newPassword); form.set("confirmPassword", input.confirmPassword);
      return actionResult(() => updateTenantPasswordAction({ ok: false }, form), "/dashboard/tenant/profile");
    }
    if (input.action === "revoke-others") await revokeOtherSessionsAction();
    else { const form = new FormData(); form.set("sessionId", input.sessionId); await revokeSessionAction(form); }
    return mobileJson({ ok: true });
  });
}
