"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { writePlatformAuditLog } from "@/lib/audit/security";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { DEFAULT_SUBSCRIPTION_PAYMENT_INSTRUCTIONS, createSubscriptionInvoice, subscriptionInvoiceAmount, renewedSubscriptionPeriod } from "@/lib/billing/subscription-invoice";
import { APP_PLANS } from "@/lib/billing/plans";
import { saveSubscriptionInvoice, recordSubscriptionPayment } from "@/lib/billing/invoice-ledger-service";
import { moneyMinor } from "@/lib/billing/invoice-ledger";
import { randomUUID } from "node:crypto";

export type BillingActionState = { error?: string; success?: string; invoice?: { filename: string; content: string } };

export async function organizationBillingAction(
  _previous: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
  const orgId = String(formData.get("orgId") ?? "");
  const operation = String(formData.get("operation") ?? "");
  if (!["renew", "invoice", "cancel", "payment"].includes(operation)) return { error: "Invalid billing action." };
  try {
    const subscription = await prisma.subscription.findUnique({ where: { orgId }, include: { org: { select: { name: true, slug: true, email: true } } } });
    if (!subscription) return { error: "No subscription is linked to this organisation." };
    const now = new Date();
    let success: string;
    let invoice: BillingActionState["invoice"];
    let deliveryError: string | undefined;
    if (operation === "payment") {
      if (formData.get("confirmed") !== "on") return {error:"Confirm that the payment has been received."};
      const reference = String(formData.get("paymentReference") ?? "").trim();
      const id = String(formData.get("paymentId") ?? "");
      const paidAt = String(formData.get("paidAt") ?? "");
      if (reference.length < 3 || reference.length > 120 || !/^[a-f0-9-]{36}$/i.test(id) || !/^\d{4}-\d{2}-\d{2}$/.test(paidAt) || !Number.isFinite(Date.parse(paidAt)) || new Date(paidAt) > now) return {error:"Provide a valid payment reference and payment date."};
      await recordSubscriptionPayment({orgId,invoiceId:String(formData.get("invoiceId") ?? ""),payment:{id,reference,amountMinor:moneyMinor(String(formData.get("amount") ?? "")),paidAt:new Date(paidAt).toISOString(),recordedAt:now.toISOString(),recordedBy:session.userId}});
      success = "Payment recorded. Review the balance before renewing the subscription.";
    } else if (operation === "invoice") {
      const to = subscription.billingEmail || subscription.org.email;
      const amount = subscriptionInvoiceAmount(subscription.plan, subscription.metadata);
      const paymentInstructions = process.env.ESTATEDESK_SUBSCRIPTION_PAYMENT_INSTRUCTIONS?.trim() || DEFAULT_SUBSCRIPTION_PAYMENT_INSTRUCTIONS;
      if (!paymentInstructions) return { error: "Configure EstateDesk subscription payment instructions before sending an invoice." };
      const reference = `ED-${subscription.id}-${subscription.currentPeriodEnd.toISOString().slice(0, 10)}`;
      const saved = await saveSubscriptionInvoice({orgId,actorUserId:session.userId,reference,data:{version:1,organisation:subscription.org.name,plan:APP_PLANS[subscription.plan].name,amountMinor:moneyMinor(amount.toFixed(2)),issuedAt:now.toISOString(),renewalDate:subscription.currentPeriodEnd.toISOString(),paymentInstructions,payments:[]}});
      const snapshot = saved.data;
      const pdf = await createSubscriptionInvoice({ reference, organisation: snapshot.organisation, plan: snapshot.plan, amount:snapshot.amountMinor / 100, issuedAt:new Date(snapshot.issuedAt), renewalDate:new Date(snapshot.renewalDate), paymentInstructions:snapshot.paymentInstructions });
      invoice = { filename: `${reference}.pdf`, content: Buffer.from(pdf).toString("base64") };
      success = "Invoice ready to download.";
      if (formData.get("sendEmail") === "on") {
        if (!to) deliveryError = "PDF ready. Add a billing email to also send it by email.";
        else if (!process.env.RESEND_API_KEY?.trim() || !process.env.EMAIL_FROM?.trim()) deliveryError = "PDF ready. Email delivery is not configured; download and share the invoice.";
        else try {
          await sendTransactionalEmail(to, `EstateDesk subscription invoice — ${subscription.org.name}`, [
            `Subscription invoice: ${reference}`,
            `Organisation: ${subscription.org.name}`,
            `Plan: ${APP_PLANS[subscription.plan].name}`,
            `Monthly subscription: KES ${amount.toLocaleString("en-KE")}`,
            `Renewal date: ${subscription.currentPeriodEnd.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })}`,
            paymentInstructions,
            `Quote invoice reference ${reference} when paying. Please find the invoice PDF attached.`,
            "This invoice is not a payment receipt.",
          ].join("\n"), [invoice]);
          success = `Invoice ready to download and sent to ${to}.`;
        } catch {
          deliveryError = "PDF ready, but email delivery failed. Download and share the invoice.";
        }
      }
      if (formData.get("sendEmail") === "on" && !deliveryError) {
        const recipients = await prisma.membership.findMany({
          where: { orgId, role: { in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"] }, user: { deletedAt: null } },
          select: { userId: true },
        });
        await prisma.notification.createMany({
          data: recipients.map(({ userId }) => {
            const id = randomUUID();
            return {
              id, orgId, userId, channel: "IN_APP" as const, type: "GENERAL" as const,
              title: "Subscription invoice sent", status: "SENT" as const, sentAt: now,
              message: `Invoice ${reference} for KES ${amount.toLocaleString("en-KE")} has been sent to ${to}. View or download the invoice below.`,
              providerResponse: { actionUrl: `/api/org/subscription-invoices/${id}`, subscriptionInvoice: invoice },
            };
          }),
        });
      }
    } else if (operation === "cancel") {
      if (formData.get("confirmed") !== "on") return { error: "Confirm cancellation to continue." };
      if (subscription.status === "CANCELLED") return { error: "This subscription is already cancelled." };
      await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "CANCELLED", cancelledAt: now, cancelAt: now } });
      success = "Subscription cancelled.";
    } else {
      if (formData.get("confirmed") !== "on") return { error: "Confirm payment before renewing the subscription." };
      await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE", ...renewedSubscriptionPeriod(subscription.currentPeriodEnd, now), cancelledAt: null, cancelAt: null, trialEndsAt: null } });
      success = "Subscription renewed for 30 days.";
    }
    await writePlatformAuditLog({ actorUserId: session.userId, action: `PLATFORM_SUBSCRIPTION_${operation.toUpperCase()}`, entityType: "Subscription", entityId: subscription.id, metadata: { orgId, slug: subscription.org.slug } });
    for (const path of [`/platform/billing/${orgId}`, `/platform/billing/${subscription.org.slug}`, `/platform/organizations/${subscription.org.slug}`, "/platform/billing", "/platform/subscriptions", "/dashboard/org/settings", "/dashboard/org/notifications"]) revalidatePath(path);
    return { success, invoice, error: deliveryError };
  } catch (error) {
    console.error("[organizationBillingAction]", error);
    return { error: "Could not complete the billing action. Refresh to check the current status before trying again." };
  }
}
