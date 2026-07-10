import type { AccountingJournalStatus, AccountingSourceType } from "@prisma/client";
import { getJournalRegister, journalsToCsv } from "@/lib/accounting/journal-queries";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";

export async function GET(request: Request) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const { searchParams } = new URL(request.url);

  const register = await getJournalRegister(prisma, orgId, {
    q: searchParams.get("q") ?? undefined,
    status: (searchParams.get("status") as AccountingJournalStatus | null) ?? undefined,
    sourceType: (searchParams.get("sourceType") as AccountingSourceType | null) ?? undefined,
    from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
    to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
    page: 1,
    pageSize: 500,
  });

  const csv = journalsToCsv(register.journals);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="journal-register.csv"',
    },
  });
}