import { revalidatePath } from "next/cache";
import { requireOrgPermission } from "@/lib/permissions/guards";

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

export { asObject, getString, getNumber } from "@/lib/payments/metadata";

export async function requirePaymentReviewer() {
  const session = await requireOrgPermission("payments.verify");

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  return session;
}

/** Reverse / reconcile / bank import — payments.manage. */
export async function requirePaymentManager() {
  const session = await requireOrgPermission("payments.manage");

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  return session;
}

export function revalidatePaymentSurfaces() {
  revalidatePath(PAYMENTS_PATH);
  revalidatePath("/dashboard/org/charges");
  revalidatePath("/dashboard/org/move-outs");
  revalidatePath("/move-outs");
  revalidatePath("/dashboard/org");
  revalidatePath("/dashboard/tenant");
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/dashboard/tenant/payments");
  revalidatePath("/dashboard/tenant/invoice");
  revalidatePath("/dashboard/tenant/water-bills");
}