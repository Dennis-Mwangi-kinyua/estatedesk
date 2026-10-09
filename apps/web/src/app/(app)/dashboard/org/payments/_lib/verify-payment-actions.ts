"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { paymentsMessageUrl, readString, requirePaymentReviewer, revalidatePaymentSurfaces } from "./payment-action-shared";
import { verifyPayment } from "./verify-payment";

export async function verifyTenantPaymentAction(formData: FormData) {
  const session = await requirePaymentReviewer();
  const paymentId = readString(formData, "paymentId");
  const verificationNote = readString(formData, "verificationNote");
  if (!paymentId) throw new Error("Payment id is required.");
  if (verificationNote.length < 5 || verificationNote.length > 2000) throw new Error("Record how the payment evidence was verified (5–2,000 characters).");
  await prisma.$transaction(tx => verifyPayment(tx, session, paymentId, verificationNote), { isolationLevel: "Serializable" });
  revalidatePaymentSurfaces();
  redirect(paymentsMessageUrl("Payment verified successfully."));
}
