import { SUBSCRIPTION_INVOICE_ENTITY, invoiceData } from "@/lib/billing/invoice-ledger";
import { createSubscriptionInvoice, createSubscriptionReceipt } from "@/lib/billing/subscription-invoice";
import { requireOrgRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"]);
  if (!session.activeOrgId) return Response.json({ error: "Organization access is required." }, { status: 403 });
  const { id } = await params;
  const record = await prisma.documentRecord.findFirst({ where: { id, orgId: session.activeOrgId, entityType: SUBSCRIPTION_INVOICE_ENTITY, status: { in: ["ISSUED", "COMPLETED"] } } });
  if (record) {
    const data = invoiceData(record.metadata);
    const paymentId = new URL(request.url).searchParams.get("receipt");
    if (paymentId && !data.payments.some(payment => payment.id === paymentId)) return Response.json({ error: "Receipt not found." }, { status: 404 });
    const pdf = paymentId ? await createSubscriptionReceipt(record.serialNumber, data, paymentId) : await createSubscriptionInvoice({ reference: record.serialNumber, organisation: data.organisation, plan: data.plan, amount: data.amountMinor / 100, issuedAt: new Date(data.issuedAt), renewalDate: new Date(data.renewalDate), paymentInstructions: data.paymentInstructions, ledger: data });
    return new Response(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${record.serialNumber.replace(/[^A-Za-z0-9_-]/g, "_")}${paymentId ? "-receipt" : ""}.pdf"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  }
  // Preserve links in invoices sent before the document ledger was introduced.
  const notification = await prisma.notification.findFirst({
    where: { id, orgId: session.activeOrgId, channel: "IN_APP", title: "Subscription invoice sent" },
    select: { providerResponse: true },
  });
  const metadata = notification?.providerResponse as { subscriptionInvoice?: { filename?: string; content?: string } } | null;
  const invoice = metadata?.subscriptionInvoice;
  if (!invoice?.filename || !invoice.content) return Response.json({ error: "Invoice not found." }, { status: 404 });
  const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
  const filename = invoice.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return new Response(Buffer.from(invoice.content, "base64"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
