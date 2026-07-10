import { safeApiErrorResponse } from "@/lib/errors/server-error-log";
import { csvResponse } from "@/lib/csv";
import { DataExportTooLargeError } from "@/lib/data-export/limits";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import {
  buildOrgReportCsv,
  type OrgReportExportKind,
} from "@/lib/reports/org-report-exports";

export const dynamic = "force-dynamic";

function isExportKind(value: string | null): value is OrgReportExportKind {
  return (
    value === "rent-roll" ||
    value === "arrears-aging" ||
    value === "occupancy" ||
    value === "owner-statement" ||
    value === "water-recovery"
  );
}

export async function GET(request: Request) {
  const session = await requireManagementAccess();
  const url = new URL(request.url);
  const kind = url.searchParams.get("type");
  const period = url.searchParams.get("period") ?? undefined;

  if (!isExportKind(kind)) {
    return new Response("Invalid report export type.", { status: 400 });
  }

  let csv: string;

  try {
    csv = await buildOrgReportCsv({
      orgId: session.activeOrgId!,
      kind,
      period,
    });
  } catch (error) {
    if (error instanceof DataExportTooLargeError) {
      return Response.json(
        {
          error:
            "This report is too large for immediate download. Filter it to a smaller period or run it as an offline export.",
          dataset: error.dataset,
          rowLimit: error.rowLimit,
        },
        { status: error.statusCode },
      );
    }

    return Response.json(
      safeApiErrorResponse(
        "org.reports.export",
        error,
        "Could not generate the report export.",
      ),
      { status: 500 },
    );
  }

  const fileName = `estatedesk-${kind}-${period ?? "current"}.csv`;

  await prisma.reportExport.create({
    data: {
      orgId: session.activeOrgId!,
      actorUserId: session.userId,
      reportType: kind,
      period: period ?? null,
      fileName,
      metadata: {
        bytes: Buffer.byteLength(csv, "utf8"),
      },
    },
  });

  return csvResponse(fileName, csv);
}
