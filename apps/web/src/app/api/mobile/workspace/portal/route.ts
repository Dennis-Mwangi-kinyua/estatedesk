import { mobileWorkspaceKindSchema } from "@estatedesk/contracts/mobile";
import { mobileError, mobileJson, mobileSession } from "@/lib/mobile/api";
import { isTenantPortalRequest } from "@/lib/mobile/portal-policy";
import { mobileWorkspaceAllowed, mobileWorkspaceEntry, mobileWorkspaceLinks } from "@/lib/mobile/workspace-menu";
import { mobilePortalResponse } from "@/lib/mobile/portal-response";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!isTenantPortalRequest(request)) return mobileJson({ error: "Native navigation required." }, 403);
  try {
    const session = await mobileSession();
    if (session instanceof Response) return session;
    const params = new URL(request.url).searchParams;
    const kind = mobileWorkspaceKindSchema.safeParse(params.get("kind"));
    if (!kind.success) return mobileJson({ error: "Choose a workspace." }, 400);
    if (!mobileWorkspaceAllowed(session, kind.data) || session.mustChangePassword || session.requiresTermsAcceptance) return mobileJson({ error: "This workspace is unavailable for your account." }, 403);
    const target = mobileWorkspaceEntry(mobileWorkspaceLinks(session, kind.data), params.get("path"), kind.data);
    return target ? mobilePortalResponse(target) : mobileJson({ error: "Workspace access is disabled." }, 403);
  } catch (error) { return mobileError(error); }
}
