import { cookies } from "next/headers";
import { getSessionCookieName } from "@/lib/auth/cookies";
import { changeAccountPasswordAction } from "@/features/security/password-action";
import { getManagedUserSessions } from "@/lib/auth/session";
import { nativeRoute, nativeBody } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { mobileSecurityInputSchema } from "@estatedesk/contracts/mobile";
import { revokeSessionAction, revokeOtherSessionsAction } from "@/app/(app)/dashboard/security/actions";
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
      const form = new FormData();
      form.set("currentPassword", input.currentPassword); form.set("newPassword", input.newPassword); form.set("confirmPassword", input.confirmPassword);
      const result = await changeAccountPasswordAction({ ok: false }, form);
      if (!result.ok) return mobileJson({ error: result.error }, 400);
      const name = getSessionCookieName();
      const value = (await cookies()).get(name)?.value;
      if (!value) return mobileJson({ error: "Password updated. Sign in again with your new password." }, 401);
      return mobileJson({ ok: true, message: result.message, sessionCookie: `${name}=${value}` });
    }
    if (input.action === "revoke-others") await revokeOtherSessionsAction();
    else { const form = new FormData(); form.set("sessionId", input.sessionId); await revokeSessionAction(form); }
    return mobileJson({ ok: true });
  });
}
