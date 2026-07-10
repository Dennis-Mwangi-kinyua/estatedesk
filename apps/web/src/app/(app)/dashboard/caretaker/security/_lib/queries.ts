import {
  getManagedUserSessions,
  requireUserSession,
} from "@/lib/auth/session";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { logServerError } from "@/lib/errors/server-error-log";

export const SECURITY_LOAD_ERROR_MESSAGE =
  "We couldn't load your active sessions right now. Please refresh the page or try again in a few minutes.";

export async function getCaretakerSecurityData() {
  const session = await requireUserSession();

  try {
    const sessions = await retryTransientDatabaseOperation(
      () => getManagedUserSessions(session.userId),
      { label: "caretaker security page data" },
    );

    return {
      ok: true as const,
      fullName: session.fullName,
      sessions,
      otherSessionCount: sessions.filter((item) => !item.isCurrent).length,
    };
  } catch (error) {
    logServerError("caretaker.security.load", error);

    return {
      ok: false as const,
      errorMessage: SECURITY_LOAD_ERROR_MESSAGE,
      fullName: session.fullName,
      sessions: [],
      otherSessionCount: 0,
    };
  }
}