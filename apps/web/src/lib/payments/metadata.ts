import type { Prisma } from "@prisma/client";

export function asObject(
  value: Prisma.JsonValue | null | undefined,
): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Prisma.JsonValue>;
}

export function getString(source: Record<string, Prisma.JsonValue>, key: string) {
  return typeof source[key] === "string" ? source[key] : "";
}

export function getNumber(source: Record<string, Prisma.JsonValue>, key: string) {
  return typeof source[key] === "number" ? source[key] : undefined;
}
