import { Prisma } from "@prisma/client";

export class ClientSafeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientSafeError";
  }
}

const INTERNAL_ERROR_PATTERNS = [
  /prisma/i,
  /\bP20\d{2}\b/,
  /invalid `prisma/i,
  /invocation in/i,
  /connect ECONNREFUSED/i,
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /node_modules/i,
  /NEXT_/,
  /DATABASE_URL/i,
  /\/home\/[^/\s]+/i,
  /at\s+.+\(.+:\d+:\d+\)/,
  /Unique constraint failed on the fields/i,
  /Foreign key constraint failed/i,
];

export function isPrismaClientError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError
  );
}

export function isInternalErrorMessage(message: string) {
  if (!message.trim()) return true;
  if (message.length > 240) return true;

  return INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function safeClientMessage(error: unknown, fallback: string) {
  if (error instanceof ClientSafeError) {
    return error.message;
  }

  if (isPrismaClientError(error)) {
    return fallback;
  }

  if (error instanceof Error) {
    if (isInternalErrorMessage(error.message)) {
      return fallback;
    }

    return error.message;
  }

  return fallback;
}