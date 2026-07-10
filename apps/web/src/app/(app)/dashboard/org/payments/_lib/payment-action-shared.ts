import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/permissions/guards";

export const PAYMENTS_PATH = "/dashboard/org/payments";

export function paymentsMessageUrl(
  message: string,
  messageType: "success" | "error" = "success",
) {
  const params = new URLSearchParams({ message, messageType });
  return `${PAYMENTS_PATH}?${params.toString()}`;
}

export function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

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

export async function requirePaymentReviewer() {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  return session;
}

export function revalidatePaymentSurfaces() {
  revalidatePath(PAYMENTS_PATH);
  revalidatePath("/dashboard/org/charges");
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/dashboard/tenant/payments");
  revalidatePath("/dashboard/tenant/invoice");
  revalidatePath("/dashboard/tenant/water-bills");
}