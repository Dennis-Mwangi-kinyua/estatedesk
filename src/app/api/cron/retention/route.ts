import { NextResponse } from "next/server";
import { buildRetentionReport } from "@/lib/data-retention/report";
import { sendSecurityAlert } from "@/lib/security/alerts";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await buildRetentionReport();
  const totalRecords = report.reduce((sum, org) => sum + org.total, 0);

  if (totalRecords > 0) {
    await sendSecurityAlert({
      event: "DATA_RETENTION_REVIEW_REQUIRED",
      severity: "info",
      summary: `${totalRecords} soft-deleted records are older than their organization retention policy.`,
      metadata: {
        mode: "report_only",
        organizations: report.map((org) => ({
          orgId: org.orgId,
          orgName: org.orgName,
          total: org.total,
          cutoff: org.cutoff,
        })),
      },
    });
  }

  return NextResponse.json({
    mode: "report_only",
    totalOrganizations: report.length,
    totalRecords,
    report,
  });
}
