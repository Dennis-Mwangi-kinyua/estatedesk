import { buildOwnerStatementPdfForLandlord } from "@/lib/accounting/owner-statement-delivery";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";

export async function GET(request: Request) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const { searchParams } = new URL(request.url);

  const landlordId = searchParams.get("landlordId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!landlordId) {
    return new Response("landlordId is required", { status: 400 });
  }

  const now = new Date();
  const { pdfBytes, statement } = await buildOwnerStatementPdfForLandlord(
    prisma,
    orgId,
    landlordId,
    from ? new Date(from) : new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
    to ? new Date(to) : now,
  );

  const slug = statement.landlord.displayName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="owner-statement-${slug}.pdf"`,
    },
  });
}