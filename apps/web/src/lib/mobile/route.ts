import "server-only";
import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { isNativeRequest, mobileError, mobileJson, mobileSession } from "./api";
import type { AppSession } from "@/lib/auth/session";
import { PayloadTooLargeError, readBoundedJson } from "@/lib/security/bounded-json";
import { checkRateLimit } from "@/lib/rate-limit";
import { rolePolicyBlocksPath } from "@/lib/permissions/org-role-policy";

export async function nativeRoute(request: Request, handler: (session: AppSession) => Promise<Response>, options: { setup?: boolean; role?: string } = {}) {
  if (!isNativeRequest(request)) return mobileJson({ error: "Native client required." }, 403);
  try {
    const session = await mobileSession();
    if (session instanceof Response) return session;
    if (new URL(request.url).pathname === "/api/mobile/push" && rolePolicyBlocksPath(session.orgRolePolicy, "/api/mobile/notifications")) return mobileJson({ error: "Notifications are disabled for your role." }, 403);
    if (!options.setup && (session.mustChangePassword || session.requiresTermsAcceptance)) return mobileJson({ error: "Complete your account setup first." }, 403);
    if (options.role && session.activeOrgRole !== options.role) return mobileJson({ error: "This role cannot access that workspace." }, 403);
    if (rolePolicyBlocksPath(session.orgRolePolicy, new URL(request.url).pathname)) return mobileJson({ error: "This section is disabled for your role." }, 403);
    if (request.method !== "GET") {
      const limit = await checkRateLimit({ key: `mobile:${session.userId}:${new URL(request.url).pathname}`, limit: 20, windowMs: 60_000 });
      if (!limit.allowed) return mobileJson({ error: "Too many requests. Please wait a minute." }, 429);
    }
    return await handler(session);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return mobileJson({ error: "Request too large." }, 413);
    if (error instanceof z.ZodError || error instanceof SyntaxError) return mobileJson({ error: "Please check the submitted fields." }, 400);
    return mobileError(error);
  }
}

export async function nativeBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new SyntaxError("JSON required.");
  return schema.parse(await readBoundedJson(request, 16_384));
}

/** Only the exact expected success redirect proves an existing web action succeeded. */
export async function actionResult(action: () => Promise<unknown>, successPath: string) {
  try {
    const result = await action();
    if (result && typeof result === "object" && "error" in result && result.error) return mobileJson({ error: String(result.error) }, 400);
    return mobileJson({ ok: true });
  } catch (error) {
    if (!isRedirectError(error)) throw error;
    const url = new URL(getURLFromRedirectError(error) ?? "/", "https://estatedesk.invalid");
    if (url.origin !== "https://estatedesk.invalid" || url.pathname !== successPath || url.searchParams.has("error")) throw error;
    return mobileJson({ ok: true, status: url.searchParams.get("status") });
  }
}
