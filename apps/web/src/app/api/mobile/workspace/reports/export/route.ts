import { z } from "zod";
import { reportFiltersSchema } from "@estatedesk/contracts/mobile";
import { nativeRoute } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { mobileWorkspaceAllowed, mobileWorkspaceLinks } from "@/lib/mobile/workspace-menu";
import { nativeWorkspaceEntry } from "@/lib/mobile/native-workspace-policy";
import { platformReport, ReportAccessError, ReportExportLimitError } from "@/lib/reports/platform";
import { reportExportRows, reportCsv, reportPdf } from "@/lib/reports/export";
import { checkRateLimit } from "@/lib/rate-limit";
export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    if (!mobileWorkspaceAllowed(session, "platform") || !nativeWorkspaceEntry(mobileWorkspaceLinks(session, "platform"), "/platform/reports")) return mobileJson({ error: "You do not have access to platform reports." }, 403);
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const filters = reportFiltersSchema.parse(params);
    const format = z.enum(["pdf", "csv"]).parse(params.format);
    const limit = await checkRateLimit({ key: `mobile-report-export:${session.userId}`, limit: 5, windowMs: 60000 });
    if (!limit.allowed) return mobileJson({ error: "Please wait a minute before exporting again." }, 429);
    try {
      const data = await platformReport(session, filters, true);
      const rows = reportExportRows(data);
      const bytes = format === "pdf" ? await reportPdf(rows) : Buffer.from(reportCsv(rows), "utf8");
      if (bytes.length > 12000000) return mobileJson({ error: "Narrow the report filters to create a smaller export." }, 413);
      return mobileJson({ filename: `estatedesk-reports-${data.report.from}-${data.report.to}.${format}`, content: Buffer.from(bytes).toString("base64"), mimeType: format === "pdf" ? "application/pdf" : "text/csv" });
    } catch (error) {
      if (error instanceof ReportAccessError) return mobileJson({ error: error.message }, 403);
      if (error instanceof ReportExportLimitError) return mobileJson({ error: error.message }, 422);
      throw error;
    }
  });
}
