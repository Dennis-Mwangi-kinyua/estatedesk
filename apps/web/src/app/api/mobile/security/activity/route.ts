import { nativeRoute } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { rolePolicyBlocksPath } from "@/lib/permissions/org-role-policy";
import { getAccountSecurityActivity } from "@/lib/security/account-events";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    if (rolePolicyBlocksPath(session.orgRolePolicy, "/dashboard/security")) return mobileJson({ error: "Security access is unavailable." }, 403);
    return mobileJson(await getAccountSecurityActivity(session.userId));
  });
}
