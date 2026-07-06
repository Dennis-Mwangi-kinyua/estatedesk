import "server-only";

import { safeClientMessage } from "@/lib/errors/client-safe-error";
export { throwSafeActionFailure } from "@/lib/errors/throw-safe-action-failure";

export function logServerError(
  context: string,
  error: unknown,
  meta?: Record<string, unknown>,
) {
  const details =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : { error };

  console.error(`[${context}]`, details, meta ?? {});
}

export function safeServerActionError(
  context: string,
  error: unknown,
  fallback: string,
) {
  const message = safeClientMessage(error, fallback);

  if (message === fallback) {
    logServerError(context, error);
  }

  return message;
}

export function safeApiErrorResponse(
  context: string,
  error: unknown,
  fallback: string,
) {
  logServerError(context, error);
  return { error: fallback };
}

