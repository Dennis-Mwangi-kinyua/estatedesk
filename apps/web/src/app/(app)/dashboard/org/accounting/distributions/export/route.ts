import { getOwnerStatement, ownerStatementToCsv } from "@/lib/accounting/owner-statements";
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
  const statement = await getOwnerStatement(
    prisma,
    orgId,
    landlordId,
    from ? new Date(from) : new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
    to ? new Date(to) : now,
  );

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { currencyCode: true },
  });

  const csv = ownerStatementToCsv({
    landlordName: statement.landlord.displayName,
    from: statement.from,
    to: statement.to,
    currencyCode: org.currencyCode,
    properties: statement.properties,
    totals: statement.totals,
  });

  const slug = statement.landlord.displayName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="owner-statement-${slug}.csv"`,
    },
  });
}