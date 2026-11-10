"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUserSession, getCurrentSessionId } from "@/lib/auth/session";
import { createSessionCookieValue, getSessionCookieName, getSessionCookieOptions } from "@/lib/auth/cookies";
import { AccountPasswordError, changeAccountPassword } from "./_lib/change-password";

export type AccountPasswordState = { ok: boolean; error?: string; message?: string };
export async function changeAccountPasswordAction(_state: AccountPasswordState, form: FormData): Promise<AccountPasswordState> {
  const session = await requireUserSession();
  if (session.mustChangePassword || session.requiresTermsAcceptance) return { ok: false, error: "Complete your account setup first." };
  const sessionId = await getCurrentSessionId();
  if (!sessionId) return { ok: false, error: "Please sign in again." };
  try {
    const result = await changeAccountPassword({ userId: session.userId, sessionId, values: Object.fromEntries(["currentPassword", "newPassword", "confirmPassword"].map(key => [key, form.get(key)])) });
    const maxAge = Math.max(1, Math.floor((result.expiresAt.getTime() - Date.now()) / 1000));
    (await cookies()).set(getSessionCookieName(), createSessionCookieValue(result.token), getSessionCookieOptions(maxAge));
    for (const path of ["/dashboard/security", "/dashboard/org/security", "/dashboard/caretaker/security", "/dashboard/tenant/profile", "/dashboard/tenant/profile/change-password"]) revalidatePath(path);
    return { ok: true, message: "Password updated. Other devices are signed out and outstanding reset links no longer work." };
  } catch (error) {
    if (error instanceof AccountPasswordError) return { ok: false, error: error.message };
    console.error("Account password update could not be completed");
    return { ok: false, error: "Could not update your password. Please try again." };
  }
}
