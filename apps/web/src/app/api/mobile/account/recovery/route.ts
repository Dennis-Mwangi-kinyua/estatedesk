import { z } from "zod";
import { forgotPasswordAction } from "@/app/(auth)/forgot-password/actions";
import { resetPasswordAction } from "@/app/(auth)/reset-password/actions";
import { isNativeRequest, mobileJson } from "@/lib/mobile/api";
import { checkRateLimit } from "@/lib/rate-limit";
import { readBoundedJson, PayloadTooLargeError } from "@/lib/security/bounded-json";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getURLFromRedirectError } from "next/dist/client/components/redirect";

const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), email: z.string().trim().min(1).max(254) }),
  z.object({ action: z.literal("reset"), token: z.string().trim().min(1).max(4096), password: z.string().max(256), confirmPassword: z.string().max(256) }),
]);

const statusMessage: Record<string, string> = {
  invalid: "This reset link is invalid or has already been used. Request a new one.",
  expired: "This reset link has expired. Request a new one.",
  password_mismatch: "The passwords do not match.",
  weak_password: "Choose a password with at least 8 characters.",
  missing_token: "Paste the reset link from your email, then try again.",
};

export async function POST(request: Request) {
  if (!isNativeRequest(request)) return mobileJson({ error: "Native client required." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return mobileJson({ error: "JSON required." }, 415);
  let body: unknown;
  try { body = await readBoundedJson(request, 8192); }
  catch (error) {
    return mobileJson({ error: error instanceof PayloadTooLargeError ? "Request too large." : "Invalid request." }, error instanceof PayloadTooLargeError ? 413 : 400);
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return mobileJson({ error: "Check the recovery details and try again." }, 400);

  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const resetLimit = parsed.data.action === "reset"
    ? await checkRateLimit({ key: `mobile-password-reset:ip:${ipAddress}`, limit: 10, windowMs: 15 * 60 * 1000 })
    : null;
  if (resetLimit && !resetLimit.allowed) return mobileJson({ error: "Too many reset attempts. Wait a little and try again." }, 429);

  const form = new FormData();
  let expectedPath: string;
  if (parsed.data.action === "request") {
    form.set("email", parsed.data.email);
    expectedPath = "/forgot-password";
  } else {
    form.set("token", parsed.data.token);
    form.set("password", parsed.data.password);
    form.set("confirmPassword", parsed.data.confirmPassword);
    expectedPath = "/reset-password";
  }

  try {
    if (parsed.data.action === "request") await forgotPasswordAction(form);
    else await resetPasswordAction(form);
  } catch (error) {
    if (!isRedirectError(error)) {
      console.error("Mobile account recovery failed", error);
      return mobileJson({ error: "Unable to complete account recovery. Please try again." }, 503);
    }
    const destination = new URL(getURLFromRedirectError(error) ?? "/", "https://estatedesk.invalid");
    if (destination.origin !== "https://estatedesk.invalid" || destination.pathname !== expectedPath) throw error;
    const status = destination.searchParams.get("status") ?? "";
    if (parsed.data.action === "request") {
      if (status === "invalid_email") return mobileJson({ error: "Enter a valid email address." }, 400);
      if (status === "limited") return mobileJson({ error: "Too many reset requests. Wait a little and try again." }, 429);
      // The response is the same whether or not an account uses this email.
      return mobileJson({ ok: true, message: "If an account exists for that email, a reset link has been sent." });
    }
    if (status === "success") return mobileJson({ ok: true, message: "Password updated. You can now sign in." });
    return mobileJson({ error: statusMessage[status] ?? "Unable to reset the password. Request a new reset link." }, 400);
  }
  return mobileJson({ error: "Unable to complete account recovery. Please try again." }, 503);
}
