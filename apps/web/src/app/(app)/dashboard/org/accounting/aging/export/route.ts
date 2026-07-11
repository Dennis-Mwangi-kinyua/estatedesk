import { requireOrgRole } from "@/lib/permissions/guards";
import { getAccountingPageData } from "../../_lib/queries";

export const dynamic = "force-dynamic";

/**
 * CSV export of AR + AP aging for bookkeeping close packs.
 */
export async function GET() {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const data = await getAccountingPageData(orgId);

  if (!data.isInitialized) {
    return new Response("Accounting not initialized.", { status: 400 });
  }

  const rows: string[][] = [
    [
      "side",
      "party",
      "reference",
      "due_date",
      "days_past_due",
      "bucket",
      "balance",
      "currency",
    ],
  ];

  for (const item of data.arAging.items) {
    rows.push([
      "AR",
      item.party,
      item.reference,
      item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : "",
      String(item.daysPastDue),
      item.bucket,
      String(item.balance),
      data.org.currencyCode,
    ]);
  }
  for (const item of data.apAging.items) {
    rows.push([
      "AP",
      item.party,
      item.reference,
      item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : "",
      String(item.daysPastDue),
      item.bucket,
      String(item.balance),
      data.org.currencyCode,
    ]);
  }

  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
          return value;
        })
        .join(","),
    )
    .join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aging-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
