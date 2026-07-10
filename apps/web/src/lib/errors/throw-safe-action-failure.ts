import {
  ClientSafeError,
  safeClientMessage,
} from "@/lib/errors/client-safe-error";

function logMaskedError(context: string, error: unknown) {
  const details =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : { error };

  console.error(`[${context}]`, details);
}

export function throwSafeActionFailure(
  context: string,
  error: unknown,
  fallback: string,
): never {
  if (error instanceof ClientSafeError) {
    throw error;
  }

  const message = safeClientMessage(error, fallback);
  if (message !== fallback) {
    throw new ClientSafeError(message);
  }

  logMaskedError(context, error);
  throw new ClientSafeError(fallback);
}