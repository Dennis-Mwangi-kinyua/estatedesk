import { clearUserSession } from "@/lib/auth/session";
import { isNativeRequest, mobileError, mobileJson } from "@/lib/mobile/api";

export async function POST(request: Request) {
  if (!isNativeRequest(request)) return mobileJson({ error: "Native client required." }, 403);
  try {
    await clearUserSession();
    return mobileJson({ success: true });
  } catch (error) { return mobileError(error); }
}
