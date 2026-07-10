import "server-only";

type RetryOptions = {
  attempts?: number;
  delayMs?: number;
  label: string;
};

const shouldLogTransientRetries =
  process.env.NODE_ENV === "production" ||
  process.env.LOG_TRANSIENT_DB_RETRIES === "true";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function summarizeDatabaseError(error: unknown) {
  const value = error as {
    code?: unknown;
    name?: unknown;
    message?: unknown;
    cause?: {
      code?: unknown;
      name?: unknown;
      message?: unknown;
    };
  };

  const code = String(value.code ?? value.cause?.code ?? "unknown");
  const primaryMessage = String(value.message ?? "");
  const causeMessage = String(value.cause?.message ?? "");
  const message = (primaryMessage.startsWith("Invalid `") && causeMessage
    ? causeMessage
    : primaryMessage || causeMessage || "Database request failed")
    .replace(/\s+/g, " ")
    .trim();

  return {
    code,
    name: String(value.name ?? value.cause?.name ?? "unknown"),
    message: message.length > 180 ? `${message.slice(0, 177)}...` : message,
  };
}

export function isTransientDatabaseError(error: unknown) {
  const value = error as {
    code?: unknown;
    message?: unknown;
    cause?: {
      code?: unknown;
      message?: unknown;
    };
  };

  const code = String(value.code ?? value.cause?.code ?? "");
  const message = String(value.message ?? value.cause?.message ?? "");

  const transientCodes = new Set([
    "ETIMEDOUT",
    "ECONNRESET",
    "ECONNREFUSED",
    "EPIPE",
    "EAI_AGAIN", // Transient DNS resolution failure
    "ENOTFOUND", // Transient DNS lookup failure
    "P1001", // Can't reach database server
    "P1002", // Database server timed out
    "P1008", // Operations timed out
    "P1017", // Server closed the connection
    "P2024", // Connection pool timeout
    "P2028", // Transaction start timeout / interactive transaction errors
  ]);

  const normalizedMessage = message.toLowerCase();

  return (
    transientCodes.has(code) ||
    message.includes("Connection terminated") ||
    normalizedMessage.includes("getaddrinfo") ||
    normalizedMessage.includes("eai_again") ||
    normalizedMessage.includes("timeout") ||
    normalizedMessage.includes("can't reach database server") ||
    normalizedMessage.includes("connection closed") ||
    normalizedMessage.includes("connection terminated unexpectedly") ||
    normalizedMessage.includes("unable to start a transaction")
  );
}

export async function retryTransientDatabaseOperation<T>(
  operation: () => Promise<T>,
  { attempts = 4, delayMs = 500, label }: RetryOptions,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientDatabaseError(error) || attempt >= attempts) {
        throw error;
      }

      if (shouldLogTransientRetries) {
        console.warn(`${label} failed transiently; retrying`, {
          attempt,
          ...summarizeDatabaseError(error),
        });
      }

      await wait(delayMs * attempt);
    }
  }

  throw lastError;
}
