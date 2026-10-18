import { tenantWorkspaceEntry } from "@estatedesk/contracts/mobile";
import { mobilePortalResponse } from "@/lib/mobile/portal-response";
import { mobileError, mobileJson, mobileSession } from "@/lib/mobile/api";
import { isTenantPortalRequest } from "@/lib/mobile/portal-policy";

export const dynamic = "force-dynamic";

/** Install the existing authenticated session in the isolated in-app browser.
 * No new login, URL credentials, script-readable cookie or external redirect.
 * Every subsequent page/action retains the web's own authorization checks.
 */
export async function GET(request: Request) {
  if (!isTenantPortalRequest(request)) return mobileJson({ error: "Native navigation required." }, 403);
  try {
    const session = await mobileSession();
    if (session instanceof Response) return session;
    if (session.activeOrgRole !== "TENANT" || !session.activeOrgId || session.mustChangePassword || session.requiresTermsAcceptance) {
      return mobileJson({ error: "Complete tenant account setup before opening this workspace." }, 403);
    }
    return mobilePortalResponse(tenantWorkspaceEntry(new URL(request.url).searchParams.get("path")));
  } catch (error) { return mobileError(error); }
}
