"use server";
import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/permissions/guards";
import { acknowledgeSubscriptionPayment } from "@/lib/billing/invoice-ledger-service";
export async function acknowledgePayment(_previous: { message?: string; error?: string }, form: FormData): Promise<{ message?: string; error?: string }> {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"]);
  try {
    await acknowledgeSubscriptionPayment({ orgId: session.activeOrgId!, userId: session.userId, invoiceId: String(form.get("invoiceId") ?? ""), paymentId: String(form.get("paymentId") ?? "") });
    revalidatePath("/dashboard/org/subscription");
    revalidatePath(`/platform/billing/${session.activeOrgId}`);
    return { message: "Payment record acknowledged. Your receipt is available below." };
  } catch { return { error: "Could not acknowledge this payment. Refresh and try again." }; }
}
