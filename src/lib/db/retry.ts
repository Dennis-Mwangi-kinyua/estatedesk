import "server-only";

type RetryOptions = {
  attempts?: number;
  delayMs?: number;
  label: string;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  return (
    code === "ETIMEDOUT" ||
    message.includes("Connection terminated") ||
    message.toLowerCase().includes("timeout")
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

      console.warn(`${label} failed transiently; retrying`, error);
      await wait(delayMs * attempt);
    }
  }

  throw lastError;
}
