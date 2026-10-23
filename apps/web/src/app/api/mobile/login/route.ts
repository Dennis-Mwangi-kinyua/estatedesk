import { cookies } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { loginAction } from "@/app/(auth)/login/actions";
import { getSessionCookieName } from "@/lib/auth/cookies";
import { isNativeRequest, mobileError, mobileJson } from "@/lib/mobile/api";
import { mobileLoginSchema } from "@estatedesk/contracts/mobile";
import { PayloadTooLargeError, readBoundedJson } from "@/lib/security/bounded-json";

export async function POST(request: Request) {
  if (!isNativeRequest(request)) return mobileJson({ error: "Native client required." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return mobileJson({ error: "JSON required." }, 415);
  }
  let body: unknown;
  try {
    body = await readBoundedJson(request, 4096);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return mobileJson({ error: "Request too large." }, 413);
    return mobileJson({ error: "Invalid request." }, 400);
  }
  const parsed = mobileLoginSchema.safeParse(body);
  if (!parsed.success) return mobileJson({ error: "Enter your email or username and password." }, 400);
  try {
    const store = await cookies();
    const name = getSessionCookieName();
    const previous = store.get(name)?.value;
    const form = new FormData();
    form.set("email", parsed.data.email);
    form.set("password", parsed.data.password);
    try {
      const result = await loginAction({ success: false }, form);
      return mobileJson({ error: result.error ?? "Unable to sign in." }, 401);
    } catch (error) {
      if (!isRedirectError(error)) throw error;
      // Only a freshly issued session proves this login succeeded. Account
      // suspension/onboarding redirects must never return an old session.
      const value = (await cookies()).get(name)?.value;
      if (!value || value === previous) {
        return mobileJson({ error: "Sign-in could not be completed. Please check your account on the website." }, 403);
      }
      return mobileJson({ sessionCookie: `${name}=${value}` });
    }
  } catch (error) {
    return mobileError(error);
  }
}
