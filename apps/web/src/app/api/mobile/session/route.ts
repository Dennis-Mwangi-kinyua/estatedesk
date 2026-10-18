import { isNativeRequest, mobileError, mobileJson, mobileSession, sessionSummary } from "@/lib/mobile/api";

export async function GET(request: Request) {
  if (!isNativeRequest(request)) return mobileJson({ error: "Native client required." }, 403);
  try {
    const session = await mobileSession();
    if (session instanceof Response) return session;
    return mobileJson(await sessionSummary(session, request.headers.get("X-EstateDesk-Capabilities")));
  } catch (error) { return mobileError(error); }
}
