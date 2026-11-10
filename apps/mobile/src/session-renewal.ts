import { mobileLoginResponseSchema } from "@estatedesk/contracts/mobile";
import { ApiError } from "./http-response";

/** The password is already changed: a keychain failure must require sign-in,
 * not leave the UI relying on the revoked credential or suggest retrying it.
 */
export async function storeRenewedSession(result: unknown, ports: { save: (cookie: string) => Promise<void>; clear: () => Promise<void> }, failureMessage = "Password updated. Sign in again with your new password to continue.") {
  try {
    const { sessionCookie } = mobileLoginResponseSchema.parse(result);
    await ports.save(sessionCookie);
  } catch {
    try { await ports.clear(); } catch { /* The server has already revoked the old credential. */ }
    throw new ApiError(failureMessage, 401);
  }
}
