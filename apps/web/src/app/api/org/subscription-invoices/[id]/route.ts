import { requireOrgRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"]);
  if (!session.activeOrgId) return Response.json({ error: "Organization access is required." }, { status: 403 });
  const { id } = await params;
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
