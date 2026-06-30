import { csvResponse } from "@/lib/csv";
import { DataExportTooLargeError } from "@/lib/data-export/limits";
import { requireOrgRole } from "@/lib/permissions/guards";
import {
  buildPaymentReconciliationCsv,
  parseReconciliationStatus,
} from "@/lib/reports/payment-reconciliation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);

  if (!session.activeOrgId) {
    return Response.json({ error: "Missing active organization." }, { status: 400 });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get("period") ?? undefined;
  const status = parseReconciliationStatus(url.searchParams.get("status"));

  try {
    const csv = await buildPaymentReconciliationCsv({
      orgId: session.activeOrgId,
      period,
      status,
    });
    const fileName = `estatedesk-payment-reconciliation-${period ?? "current"}${
      status ? `-${status.toLowerCase()}` : ""
    }.csv`;

    return csvResponse(fileName, csv);
  } catch (error) {
    if (error instanceof DataExportTooLargeError) {
      return Response.json(
        {
          error:
            "This reconciliation report is too large for immediate download. Filter it to a smaller period or status.",
          dataset: error.dataset,
          rowLimit: error.rowLimit,
        },
        { status: error.statusCode },
      );
    }

    throw error;
  }
}
